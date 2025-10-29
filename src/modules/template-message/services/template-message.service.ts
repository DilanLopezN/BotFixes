import { CacheService } from '../../_core/cache/cache.service';
import { User } from '../../users/interfaces/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { isObjectIdOrHexString, Model } from 'mongoose';
import { TemplateMessage, WabaResultType } from '../interface/template-message.interface';
import { isAnySystemAdmin, isSystemAdmin, isWorkspaceAdmin } from '../../../common/utils/roles';
import { UploadingFile } from '../../../common/interfaces/uploading-file.interface';
import { StorageService } from '../../storage/storage.service';
import { CatchError, Exceptions } from '../../auth/exceptions';
import axios from 'axios';
import { TemplateButtonType, TemplateStatus, TemplateType } from '../schema/template-message.schema';
import {
    TemplateButton,
    TemplateMessageChannel,
    TemplateMessageDto,
    TemplateVariable,
} from '../dto/template-message.dto';
import { castObjectId, castObjectIdToString } from '../../../common/utils/utils';
import {
    defaultVariablesTemplate,
    TemplateCategory,
    TemplateTypeGupshup,
} from '../../channels/gupshup/services/partner-api.service';
import * as handlebars from 'handlebars';
import { ExternalDataService } from './external-data.service';
import * as Sentry from '@sentry/node';
import { hasChangedFields } from '../../../common/utils/changeTracker';
import { TemplateMessageHistoryService } from './template-message-history.service';
import { ChannelConfig } from '../../channel-config/interfaces/channel-config.interface';
import { SuggestionTextsService } from '../../../modules/suggestion-texts-v2/services/suggestion-texts.service';

const MAX_LENGTH_MESSAGE_HSM = 1024;
const MAX_LENGTH_MESSAGE_WITH_FILE = 1024;
const MAX_LENGTH_MESSAGE = 4096;
const MIN_LENGTH_MESSAGE = 10;
const MAX_LENGTH_FOOTER_MESSAGE = 60;
// link document whatsapp media - https://developers.facebook.com/docs/whatsapp/on-premises/reference/media/
const VALID_FILE_IMAGE_TEMPLATE_HSM = ['image/jpeg', 'image/png'];
const VALID_FILE_VIDEO_TEMPLATE_HSM = ['video/mp4', 'video/3gpp'];
const VALID_FILE_AUDIO_TEMPLATE_HSM = ['audio/aac', 'audio/amr', 'audio/mpeg', 'audio/mp4', 'audio/ogg'];
const VALID_FILE_DOCUMENT_TEMPLATE_HSM = [
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
];
const MAX_SIZE_FILE_IMAGE_TEMPLATE_HSM = 5000000; // 5 MB
const MAX_SIZE_FILE_VIDEO_TEMPLATE_HSM = 16000000; // 16 MB
const MAX_SIZE_FILE_AUDIO_TEMPLATE_HSM = 16000000; // 16 MB
const MAX_SIZE_FILE_DOCUMENT_TEMPLATE_HSM = 100000000; // 100 MB

// Expressão regular para garantir que não haja outras variáveis dentro das chaves
const noOtherVariablesPattern = /\{\{[^{}]*\}\}/;

/// Expressão regular para permitir mais de uma ocorrência das variáveis padrão e não permitir outras variáveis
const onlyStandardVariablesPattern = /^([^{}]*\{\{(agent\.name|conversation\.iid|user\.name|user\.phone)\}\}[^{}]*)+$/;

@Injectable()
export class TemplateMessageService extends MongooseAbstractionService<TemplateMessage> {
    constructor(
        @InjectModel('TemplateMessage') protected readonly model: Model<TemplateMessage>,
        private readonly templateMessageHistoryService: TemplateMessageHistoryService,
        private readonly suggestionTextsService: SuggestionTextsService,
        cacheService: CacheService,
        private readonly storageService: StorageService,
        private readonly externalDataService: ExternalDataService,
    ) {
        super(model, cacheService, null);
    }

    getSearchFilter(search: string): any {
        if (
            String(search)
                .split('')
                .every((char: string) => char === '.')
        ) {
            search = `[${search}]`;
        }

        if (search.startsWith('/')) {
            const cleanSearch = search.slice(1);
            return {
                name: { $regex: `.*${cleanSearch}.*`, $options: 'i' },
            };
        }

        return {
            $or: [
                { name: { $regex: `.*${search}.*`, $options: 'i' } },
                { message: { $regex: `.*${search}.*`, $options: 'i' } },
            ],
        };
    }

    getEventsData(): void {}

    @CatchError()
    async checkTemplateUsage(workspaceId: string, templateId: string): Promise<Boolean> {
        const activeMessageUsage = await this.externalDataService.checkActiveMessageTemplateUsage(
            workspaceId,
            templateId,
        );
        const scheduleUsage = await this.externalDataService.checkScheduleTemplateUsage(workspaceId, templateId);
        const campaignUsage = await this.externalDataService.checkCampaignTemplateUsage(workspaceId, templateId);

        return !!activeMessageUsage || !!scheduleUsage || !!campaignUsage;
    }

    validationVariables = (message: string, templateVariables: TemplateVariable[]) => {
        const variables: string[] = [];
        message.match(/{{(.*?)}}/g)?.forEach((string, index) => {
            variables.push(string);
        });
        let validMessageTemplate = true;
        let variableEmpty = false;
        variables?.forEach((currVariable) => {
            if (!variableEmpty) {
                const value = currVariable.replace(/[{,}]/g, '');
                const existVariable = templateVariables?.find((entity) => entity.value === value);
                const isDefault = !!defaultVariablesTemplate.find((curr) => curr === value);
                if (!existVariable && !isDefault) {
                    variableEmpty = true;
                }
            }
            if (!validMessageTemplate) {
                return;
            }

            const variablePosition = message.indexOf(currVariable);
            const maxPosition = message.length - currVariable.length - 10;
            const minPosition = 4;

            if (variablePosition < minPosition || variablePosition > maxPosition) {
                validMessageTemplate = false;
            }
        });

        return { validMessageTemplate, variableEmpty };
    };

    @CatchError()
    async getAppNamesTemplateHsm(workspaceId: string, channels: string[]) {
        let appNames: string[] = [];
        let templateChannelConfigs = channels;
        const workspaceChannelConfigs = await this.externalDataService.getChannelConfigByWorkspaceIdAndGupshup(
            workspaceId,
        );

        if (!channels.length) {
            templateChannelConfigs = workspaceChannelConfigs
                .filter(
                    (currChannel) =>
                        currChannel.enable &&
                        !!currChannel.configData?.appName &&
                        !!currChannel.configData?.apikey &&
                        !currChannel?.whatsappProvider,
                )
                .map((channel) => {
                    appNames.push(channel.configData.appName);
                    return String(channel._id);
                });
        } else {
            templateChannelConfigs = workspaceChannelConfigs
                .filter((currChannel) => {
                    if (
                        currChannel.enable &&
                        !!currChannel.configData?.appName &&
                        !!currChannel.configData?.apikey &&
                        !currChannel?.whatsappProvider
                    ) {
                        return channels.find((channelId) => String(channelId) === String(currChannel._id));
                    }
                })
                .map((channel) => {
                    appNames.push(channel.configData.appName);
                    return String(channel._id);
                });
        }

        return { templateAppNames: appNames, templateChannelConfigs };
    }

    checkValidTemplateButtons(
        buttons: TemplateButton[],
        templateCategory: TemplateCategory = TemplateCategory.UTILITY,
        templateIsHsm: boolean = true,
    ) {
        if (buttons && buttons.length) {
            if (templateCategory == TemplateCategory.AUTHENTICATION) {
                if (buttons.length > 2) {
                    throw Exceptions.TEMPLATE_BUTTONS_LENGTH_EXCEED;
                }
                if (!!buttons.find((bt) => bt.type === TemplateButtonType.URL)) {
                    throw Exceptions.TEMPLATE_INVALID_BUTTON_TYPE;
                }
            } else {
                if (buttons.length > 10) {
                    throw Exceptions.TEMPLATE_BUTTONS_LENGTH_EXCEED;
                }

                // Se o template não é oficial só pode conter um botão do tipo url para enviar como CTA url
                if (
                    !templateIsHsm &&
                    !!buttons.find((bt) => bt.type === TemplateButtonType.URL && buttons.length > 1)
                ) {
                    throw Exceptions.TEMPLATE_INVALID_BUTTON_TYPE;
                }
                // verifica se os botões possuem texto ou se o texto ultrapassa o limite de 20 caracteres caso type seja QUICK_REPLY
                // ou caso seja type URL limite da url seja até 2000 caracteres
                // faz a validação das regras de botão URL do whatsapp
                for (const button of buttons) {
                    const exceededMaxSizeText = !button?.text || button?.text?.length > 20;
                    let exceededMaxSizeURL = false;
                    if (button.type === TemplateButtonType.URL) {
                        exceededMaxSizeURL = !button.url || button?.url?.length > 2000;
                        const variables = button.url.match(/\{\{(.+?)\}\}/g);
                        if (variables?.length) {
                            if (variables.length > 1) {
                                throw Exceptions.TEMPLATE_BUTTONS_VARIABLES_LENGTH_EXCEED;
                            }

                            if (variables[0] !== '{{1}}') {
                                throw Exceptions.TEMPLATE_BUTTONS_VARIABLES_INVALID_TEXT;
                            }

                            if (!!templateIsHsm && (!button.example?.length || !button.example?.[0])) {
                                throw Exceptions.TEMPLATE_BUTTONS_VARIABLES_MANDATORY_EXAMPLE;
                            }

                            const variableEndUrl = button.url.endsWith(variables[0]);
                            if (!variableEndUrl) {
                                throw Exceptions.TEMPLATE_BUTTONS_VARIABLES_INVALID_POSITION;
                            }
                        }
                    }

                    if (exceededMaxSizeText || exceededMaxSizeURL) {
                        throw Exceptions.TEMPLATE_BUTTONS_TEXT_LENGTH_ERROR;
                    }
                }
            }
        }
    }

    checkValidTemplateFile(file?: UploadingFile) {
        if (file) {
            let type = TemplateTypeGupshup.DOCUMENT;
            if (file.mimetype?.startsWith?.('video') && VALID_FILE_VIDEO_TEMPLATE_HSM.includes(file.mimetype)) {
                if (file.size > MAX_SIZE_FILE_VIDEO_TEMPLATE_HSM) {
                    throw Exceptions.ERROR_IN_FILE_SIZE_EXCEEDS_LIMIT;
                }
                type = TemplateTypeGupshup.VIDEO;
            }
            if (file.mimetype?.startsWith?.('audio') && VALID_FILE_AUDIO_TEMPLATE_HSM.includes(file.mimetype)) {
                if (file.size > MAX_SIZE_FILE_AUDIO_TEMPLATE_HSM) {
                    throw Exceptions.ERROR_IN_FILE_SIZE_EXCEEDS_LIMIT;
                }
                type = TemplateTypeGupshup.DOCUMENT;
            }
            if (file.mimetype?.startsWith?.('image') && VALID_FILE_IMAGE_TEMPLATE_HSM.includes(file.mimetype)) {
                if (file.size > MAX_SIZE_FILE_IMAGE_TEMPLATE_HSM) {
                    throw Exceptions.ERROR_IN_FILE_SIZE_EXCEEDS_LIMIT;
                }
                type = TemplateTypeGupshup.IMAGE;
            }
            if (
                (file.mimetype?.startsWith?.('application') || file.mimetype?.startsWith?.('text')) &&
                VALID_FILE_DOCUMENT_TEMPLATE_HSM.includes(file.mimetype)
            ) {
                if (file.size > MAX_SIZE_FILE_DOCUMENT_TEMPLATE_HSM) {
                    throw Exceptions.ERROR_IN_FILE_SIZE_EXCEEDS_LIMIT;
                }
                type = TemplateTypeGupshup.DOCUMENT;
            }
            return type;
        }
    }

    private updateVariablesTemplateHsm(
        oldTemplate: TemplateMessage,
        newTemplate: TemplateMessage,
    ): { message: string | null; variables: TemplateVariable[] | null } {
        let message = null;
        let variables = null;
        const regex = /{{(.*?)}}/g;

        if (!hasChangedFields({ ...newTemplate }, { ...oldTemplate }, ['message', 'variables'])) {
            return { message, variables };
        }

        const { validMessageTemplate, variableEmpty } = this.validationVariables(
            newTemplate.message,
            newTemplate.variables,
        );

        if (oldTemplate.isHsm) {
            if (!validMessageTemplate) {
                throw Exceptions.TEMPLATE_MESSAGE_INVALID;
            }

            if (variableEmpty) {
                throw Exceptions.TEMPLATE_VARIABLES_INVALID;
            }

            const hasChangeVariable = !!oldTemplate?.variables?.length
                ? !!oldTemplate?.variables?.filter((oldVariable, index) => {
                      const newVariable = newTemplate.variables?.[index];
                      if (oldVariable.value !== newVariable.value) {
                          return true;
                      }
                      return false;
                  })?.length
                : true;
            if (hasChangeVariable) {
                const oldMessage = oldTemplate.message.replace(regex, '{{null}}');
                const newMessage = newTemplate.message.replace(regex, '{{null}}');
                if (oldMessage !== newMessage) {
                    // não é permitido alterar a mensagem de um template oficial, apenas as variaveis
                    throw Exceptions.ERROR_UPDATE_TEMPLATE_MESSAGE_HSM;
                }
                message = newTemplate.message;
            }
            variables = newTemplate.variables;
        } else {
            if (variableEmpty) {
                throw Exceptions.TEMPLATE_VARIABLES_INVALID;
            }
            message = newTemplate.message;
            variables = newTemplate.variables;
        }
        return { message, variables };
    }

    public async _create(
        data: TemplateMessageDto & {
            user: User;
            workspaceId: string;
        },
        allowTemplateCategoryChange?: boolean,
        file?: UploadingFile,
    ) {
        let channels = data.channels;
        let active = data.active;
        let templateCategory: TemplateCategory = data.category || TemplateCategory.UTILITY;
        let appNames = [];
        let templateChannelConfigs = [];
        let templateType = TemplateTypeGupshup.TEXT;
        let flowDataChannel;
        const channelConfigList = await this.externalDataService.getChannelConfigByWorkspaceIdAndGupshup(
            data.workspaceId,
        );

        try {
            // limpa casos onde uma veriavel vem com 3 chaves em volta da variavel, exemplo: {{{variavel}} ou {{variavel}}}
            data.message = data.message.replace(/\{{3,}/g, '{{').replace(/\}{3,}/g, '}}');
        } catch (error) {
            console.log('ERROR TemplateMessageService._create: ', error);
            Sentry.captureEvent({
                message: 'ERROR TemplateMessageService._create:',
                extra: {
                    payload: {
                        error,
                        message: data.message,
                    },
                },
            });
        }

        const newWhatsappVersionChannelConfigList = channelConfigList.filter((cc) => {
            if (!cc.whatsappProvider) {
                return false;
            }

            if (data.channels && data.channels.length > 0) {
                return data.channels.some((channelId) => String(channelId) === String(cc._id));
            }

            return true;
        });

        const { validMessageTemplate, variableEmpty } = this.validationVariables(data.message, data.variables);

        if (data?.buttons?.length) {
            const existFlowButton = data.buttons.find((bt) => bt.type === TemplateButtonType.FLOW);
            if (!!existFlowButton && data.buttons.length > 1) {
                throw Exceptions.TEMPLATE_BUTTONS_LENGTH_EXCEED;
            }

            if (existFlowButton) {
                const flowData = await this.externalDataService.getFlowDataByWorkspaceIdAndId(
                    data.workspaceId,
                    existFlowButton.flowDataId,
                );

                if (!flowData) {
                    throw Exceptions.NOT_FOUND_FLOW_DATA;
                }

                if (!flowData?.flow?.active) {
                    throw Exceptions.INACTIVATED_FLOW;
                }

                flowDataChannel = [castObjectId(flowData.flow.channelConfigId)];
                channels = flowDataChannel;
            }

            this.checkValidTemplateButtons(data?.buttons, templateCategory, !!data?.isHsm);
        }

        if (data.isHsm) {
            active = false;

            if (!templateCategory) {
                templateCategory = TemplateCategory.UTILITY;
            }

            if (
                data?.message?.trim()?.length > MAX_LENGTH_MESSAGE_HSM ||
                (file && data?.message?.trim()?.length > MAX_LENGTH_MESSAGE_WITH_FILE)
            ) {
                throw Exceptions.TEMPLATE_MESSAGE_LENGTH_EXCEED;
            }

            if (data?.footerMessage?.trim()?.length > MAX_LENGTH_FOOTER_MESSAGE) {
                throw Exceptions.TEMPLATE_FOOTER_MESSAGE_LENGTH_EXCEED;
            }

            if (!validMessageTemplate) {
                throw Exceptions.TEMPLATE_MESSAGE_INVALID;
            }

            if (variableEmpty) {
                throw Exceptions.TEMPLATE_VARIABLES_INVALID;
            }

            if (file && data.message?.trim().length < MIN_LENGTH_MESSAGE) {
                throw Exceptions.TEMPLATE_MESSAGE_MIN_LENGTH;
            }

            // busca appNames gupshup v2 baseado no filtro de channels
            const appNamesResult = await this.getAppNamesTemplateHsm(
                data.workspaceId,
                flowDataChannel || data.channels,
            );
            appNames = appNamesResult.templateAppNames;
            templateChannelConfigs = appNamesResult.templateChannelConfigs;

            if (!newWhatsappVersionChannelConfigList?.length && !appNames.length) {
                throw Exceptions.TEMPLATE_CHANNEL_APPNAME_NOT_FOUND;
            }

            const allChannels = [
                ...templateChannelConfigs,
                ...newWhatsappVersionChannelConfigList.map((cc) => String(cc._id)),
            ];
            channels = flowDataChannel || allChannels;
        } else {
            if (
                data?.message?.trim()?.length > MAX_LENGTH_MESSAGE ||
                (file && data?.message?.trim()?.length > MAX_LENGTH_MESSAGE_WITH_FILE)
            ) {
                throw Exceptions.TEMPLATE_MESSAGE_LENGTH_EXCEED;
            }

            if (data?.footerMessage?.trim()?.length > MAX_LENGTH_FOOTER_MESSAGE) {
                throw Exceptions.TEMPLATE_FOOTER_MESSAGE_LENGTH_EXCEED;
            }

            if (variableEmpty) {
                throw Exceptions.TEMPLATE_VARIABLES_INVALID;
            }

            if (data?.buttons?.length > 3 && !!file) {
                // não permite template não oficial com mais de 3 botões e arquivo pois no envio de mensagem de lista não pode enviar arquivo junto
                throw Exceptions.TEMPLATE_FILE_INVALID_BUTTON_QTD;
            }
        }

        templateType = this.checkValidTemplateFile(file);

        if (isAnySystemAdmin(data.user) && data.isHsm && !data.aiSuggestion) {
            // Essa validação serve para quando um systemAdmin quer criar um template de marketing
            // se caso um system esteja querendo criar template de marketing não precisa passar pelo prompt,
            // pois o prompt é para não permitir template de marketing
            if (!(isSystemAdmin(data.user) && templateCategory === TemplateCategory.MARKETING)) {
                const { data: dataSuggestion } = await this.suggestionTextsService.getTemplateMessageSuggestions(
                    data.workspaceId,
                    { message: data.message, buttons: data.buttons },
                );
                if (dataSuggestion.remove.length) {
                    throw new UnprocessableEntityException(dataSuggestion);
                }
            }
        }

        const template = await this.create({
            ...data,
            active,
            channels,
        });

        if (!template._id) {
            throw Exceptions.ERROR_CREATE_TEMPLATE;
        }

        let fileData = null;
        if (file) {
            let filePreviewUrl = await this.uploadFileTemplate(
                template.workspaceId,
                data.user._id as string,
                castObjectIdToString(template._id),
                file,
            );

            const fileType = this.checkValidTemplateFile(file);

            fileData = {
                fileType,
                filePreviewUrl,
            };
        }

        if (!!template?.isHsm) {
            let promises = [];
            // create templates for gupshup v3 and dialog360
            if (newWhatsappVersionChannelConfigList.length) {
                const newWhatsappPromises = newWhatsappVersionChannelConfigList.map(async (cc) => {
                    try {
                        return await this.externalDataService.createTemplateMetaWhatsapp(
                            cc,
                            castObjectIdToString(template._id),
                            templateCategory,
                            template,
                            fileData,
                            file,
                            templateType,
                            allowTemplateCategoryChange,
                        );
                    } catch (error) {
                        console.log('ERROR CREATE TEMPLATE META WHATSAPP: ', error);
                        return { error: 'Error create template on meta whatsapp' };
                    }
                });
                promises = [...promises, ...newWhatsappPromises];
            }

            // create templates for gupshup v2
            if (appNames.length) {
                const gupshupV2Promises = appNames.map(async (appName, index) => {
                    try {
                        return await this.externalDataService.createTemplateGupshup(
                            appName,
                            templateChannelConfigs[index],
                            template,
                            allowTemplateCategoryChange,
                            templateCategory,
                            file,
                            templateType,
                        );
                    } catch (error) {
                        console.log('ERROR CREATE TEMPLATE GUPSHUP V2: ', error);
                        return { error: 'Error create template on gupshup v2' };
                    }
                });
                promises = [...promises, ...gupshupV2Promises];
            }

            const gupshupTemplateResult = await Promise.all(promises);

            let wabaResult: WabaResultType = {};
            let channelResult = [];
            let active = false;
            gupshupTemplateResult.forEach((currTemplateGupshup) => {
                //Lógica para o Dialog360/gupshupv3/outros pela api meta
                if (currTemplateGupshup.whatsappProvider) {
                    if (currTemplateGupshup?.error) {
                        console.log(
                            'ERROR CREATE TEMPLATE GUPSHUP - currTemplateGupshup.error: ',
                            currTemplateGupshup.error,
                        );
                        return;
                    }
                    channelResult.push(String(currTemplateGupshup.channelConfigId));
                    if (currTemplateGupshup.status === 'approved') {
                        active = true;
                        wabaResult[currTemplateGupshup.channelConfigId] = {
                            channelConfigId: currTemplateGupshup.channelConfigId,
                            appName: currTemplateGupshup?.appName,
                            status: TemplateStatus.APPROVED,
                            elementName: castObjectIdToString(template._id),
                            wabaTemplateId: currTemplateGupshup.external_id,
                            category: currTemplateGupshup?.category || templateCategory,
                        };
                    } else if (currTemplateGupshup.status === 'pending') {
                        wabaResult[currTemplateGupshup.channelConfigId] = {
                            channelConfigId: currTemplateGupshup.channelConfigId,
                            appName: currTemplateGupshup?.appName,
                            status: TemplateStatus.AWAITING_APPROVAL,
                            elementName: castObjectIdToString(template._id),
                            wabaTemplateId: currTemplateGupshup.external_id,
                            category: currTemplateGupshup?.category || templateCategory,
                        };
                    } else {
                        wabaResult[currTemplateGupshup.channelConfigId] = {
                            channelConfigId: currTemplateGupshup.channelConfigId,
                            appName: currTemplateGupshup?.appName,
                            status: TemplateStatus.ERROR_ONSUBMIT,
                            elementName: castObjectIdToString(template._id),
                            rejectedReason: currTemplateGupshup?.message,
                            category: currTemplateGupshup?.category || templateCategory,
                        };
                    }
                    // Se entrou no if do provider, retorna para não continuar para lógica do v2
                    return;
                }

                // Lógica para o Gupshup v2
                if (currTemplateGupshup?.error) {
                    console.log(
                        'ERROR CREATE TEMPLATE GUPSHUP - currTemplateGupshup.error: ',
                        currTemplateGupshup.error,
                    );
                    return;
                }
                channelResult.push(String(currTemplateGupshup.channelConfigId));

                if (currTemplateGupshup.status === 'approved') {
                    active = true;
                    wabaResult[currTemplateGupshup.channelConfigId] = {
                        channelConfigId: currTemplateGupshup.channelConfigId,
                        appName: currTemplateGupshup?.appName,
                        status: TemplateStatus.APPROVED,
                        elementName: castObjectIdToString(template._id),
                        wabaTemplateId: currTemplateGupshup.external_id,
                        category: currTemplateGupshup?.category || templateCategory,
                    };
                } else if (currTemplateGupshup.status === 'success') {
                    wabaResult[currTemplateGupshup.channelConfigId] = {
                        channelConfigId: currTemplateGupshup.channelConfigId,
                        appName: currTemplateGupshup.appName,
                        status: TemplateStatus.AWAITING_APPROVAL,
                        elementName: castObjectIdToString(template._id),
                        wabaTemplateId: currTemplateGupshup.template.id,
                        category: currTemplateGupshup?.category || templateCategory,
                    };
                } else {
                    wabaResult[currTemplateGupshup.channelConfigId] = {
                        channelConfigId: currTemplateGupshup.channelConfigId,
                        appName: currTemplateGupshup.appName,
                        status: TemplateStatus.ERROR_ONSUBMIT,
                        elementName: castObjectIdToString(template._id),
                        rejectedReason: currTemplateGupshup?.message,
                        category: currTemplateGupshup?.category || templateCategory,
                    };
                }
            });

            await this.model.updateOne(
                {
                    _id: template._id,
                },
                {
                    wabaResult: wabaResult,
                    channels: channelResult,
                    active,
                },
            );

            const result = await this.model.findOne({ _id: template._id });

            return result;
        }

        return template;
    }

    @CatchError()
    async deleteTemplate(templateId: string) {
        if (this.cacheService) {
            this.cacheService.remove(templateId).then().catch(console.log);
        }
        const template = await this.model.findOne({ _id: castObjectId(templateId) });
        if (!template) {
            throw Exceptions.NOT_FOUND;
        }

        const templateInUse = await this.checkTemplateUsage(String(template.workspaceId), templateId);

        if (templateInUse) {
            throw Exceptions.TEMPLATE_IN_USE;
        }

        if (template.isHsm) {
            try {
                await Promise.all(
                    Object.values(template.wabaResult || {})?.map(async (currWaba) => {
                        return await this.externalDataService.deleteTemplateGupshup(
                            currWaba.appName,
                            currWaba.elementName,
                        );
                    }),
                );
            } catch (error) {
                console.log('ERROR DELETE TEMPLATE HSM: ', error);
            }
        }
        if (template.type === TemplateType.file && template?.fileKey) {
            try {
                await this.storageService.delete(template.fileKey);
            } catch (err) {
                console.log(err);
            }
        }

        return await this.model.findOneAndDelete({ _id: castObjectId(template._id) } as any);
    }

    @CatchError()
    async updateTemplate(templateId: string, data: TemplateMessage, whoUserId: string, file?: UploadingFile) {
        if (this.cacheService) {
            this.cacheService.remove(templateId).then().catch(console.log);
        }
        const template = await this.model.findOne({ _id: castObjectId(templateId) });
        if (!template) {
            throw Exceptions.NOT_FOUND;
        }

        // verifica se esta tentando desativar um template que esta em uso
        if (!data?.active) {
            const templateInUse = await this.checkTemplateUsage(String(template.workspaceId), templateId);

            if (templateInUse) {
                throw Exceptions.TEMPLATE_IN_USE;
            }
        }

        let flowDataChannel;
        let newData: any = {
            ...data,
            type: data.type,
            fileUrl: data.fileUrl || null,
            fileContentType: data.fileContentType || null,
            fileKey: data.fileKey || null,
            fileOriginalName: data.fileOriginalName || null,
            fileSize: data.fileSize || null,
        };

        // verificar variaveis e mensagem antes do update dos arquivos para caso caia em uma Exception alertar antes dessa ação
        const { message, variables } = this.updateVariablesTemplateHsm(
            { ...(template.toJSON ? template.toJSON() : document) } as TemplateMessage,
            data,
        );

        if (!template.isHsm) {
            if (
                data?.message?.trim()?.length > MAX_LENGTH_MESSAGE ||
                ((file || template?.fileKey) && data?.message?.trim()?.length > MAX_LENGTH_MESSAGE_WITH_FILE)
            ) {
                throw Exceptions.TEMPLATE_MESSAGE_LENGTH_EXCEED;
            }

            if (data?.buttons?.length > 3 && !!file) {
                // não permite template não oficial com mais de 3 botões e arquivo pois no envio de mensagem de lista não pode enviar arquivo junto
                throw Exceptions.TEMPLATE_FILE_INVALID_BUTTON_QTD;
            }

            if (data?.buttons?.length) {
                const existFlowButton = data.buttons.find((bt) => bt.type === TemplateButtonType.FLOW);
                if (!!existFlowButton && data.buttons.length > 1) {
                    throw Exceptions.TEMPLATE_BUTTONS_LENGTH_EXCEED;
                }

                if (existFlowButton) {
                    const flowData = await this.externalDataService.getFlowDataByWorkspaceIdAndId(
                        data.workspaceId,
                        existFlowButton.flowDataId,
                    );

                    if (!flowData) {
                        throw Exceptions.NOT_FOUND_FLOW_DATA;
                    }

                    if (!flowData?.flow?.active) {
                        throw Exceptions.INACTIVATED_FLOW;
                    }

                    flowDataChannel = [castObjectId(flowData.flow.channelConfigId)];
                    newData.channels = flowDataChannel;
                }

                this.checkValidTemplateButtons(data?.buttons, undefined, false);
            }

            if (file) {
                this.checkValidTemplateFile(file);
                await this.uploadFileTemplate(
                    template.workspaceId,
                    whoUserId,
                    castObjectIdToString(template._id),
                    file,
                );
                delete newData.type;
                delete newData.fileUrl;
                delete newData.fileContentType;
                delete newData.fileKey;
                delete newData.fileOriginalName;
                delete newData.fileSize;
            } else if (!data.fileKey) {
                if (template.fileKey && template.type === TemplateType.file) {
                    try {
                        await this.storageService.delete(template.fileKey);
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
        } else {
            newData = {
                name: data.name,
                tags: data.tags,
                teams: data.teams,
                active: data.active,
            };
        }
        if (variables) {
            newData.variables = variables;
        }
        if (message) {
            newData.message = message;
        }

        const result = await this.model.updateOne(
            {
                _id: templateId,
            },
            {
                $set: { ...newData },
            },
        );

        if (result.modifiedCount) await this.templateMessageHistoryService.create(whoUserId, template);
        return result;
    }

    @CatchError()
    async updateCategoryTemplate(channelConfig: ChannelConfig, templateId: string, category: TemplateCategory) {
        if (this.cacheService) {
            this.cacheService.remove(templateId).then().catch(console.log);
        }
        const template = await this.model.findOne({ _id: castObjectId(templateId) });
        if (!template) {
            throw Exceptions.NOT_FOUND;
        }

        template.wabaResult[channelConfig._id.toString()].category = category;
        return await this.model.updateOne(
            { _id: template._id },
            { $set: { wabaResult: template.wabaResult, updatedAt: new Date().toISOString() } },
        );
    }

    @CatchError()
    async updateTemplateFlowInactivated(workspaceId: string, flowDataId: number) {
        return await this.model.updateMany(
            {
                workspaceId: workspaceId,
                buttons: {
                    $elemMatch: {
                        flowDataId: Number(flowDataId),
                    },
                },
            },
            {
                $set: { active: false },
            },
        );
    }

    public async _queryPaginate(query: any, user: User, workspaceId: string) {
        if (!query.filter.$and) {
            query.filter.$and = [];
        }

        const channel = query.filter.channel;

        query.filter.$and.push({
            workspaceId,
        });

        if (!!query.filter.channel) {
            delete query.filter.channel;

            if (query.filter.isHsm) {
                query.filter.$and.push({
                    $and: [
                        {
                            $or: [
                                { channels: { $exists: false } },
                                { channels: { $size: 0 } },
                                { channels: { $in: [channel] } },
                            ],
                        },
                        {
                            [`wabaResult.${channel}.status`]: { $eq: TemplateStatus.APPROVED },
                        },
                    ],
                });
            } else {
                query.filter.$and.push({
                    $or: [
                        { channels: { $exists: false } },
                        { channels: { $size: 0 } },
                        { channels: { $in: [channel] } },
                    ],
                });
            }
        }

        const workspaceAdmin = isWorkspaceAdmin(user, workspaceId);
        const isAnyAdmin = isAnySystemAdmin(user);

        if (workspaceAdmin || isAnyAdmin) {
            return await this.queryPaginate(query);
        }

        const rawTeams = await this.externalDataService.getTeamsByWorkspaceAndUser(
            workspaceId,
            castObjectIdToString(user._id),
        );
        const teamsIds: string[] = rawTeams.map((team) => team._id as string);

        query.filter.$and = [
            ...query.filter.$and,
            {
                $or: [{ teams: { $exists: false } }, { teams: { $size: 0 } }, { teams: { $in: [...teamsIds] } }],
            },
        ];

        return await this.queryPaginate(query);
    }

    async getParsedTemplate(templateId: string, values: { key: string; value: string }[]) {
        const template = await this.model.findOne({ _id: templateId });
        if (!template) return null;
        const text: string = template.message;
        if (!text || typeof text !== 'string') return null;
        let templateHandle = handlebars.compile(text);
        const parsed = templateHandle(
            values.reduce((prev, val) => {
                const keys = val.key.split('.');
                let tempObj = prev;

                for (let i = 0; i < keys.length; i++) {
                    if (i === keys.length - 1) {
                        tempObj[keys[i]] = val.value;
                    } else {
                        tempObj[keys[i]] = tempObj[keys[i]] || {};
                        tempObj = tempObj[keys[i]];
                    }
                }
                // Altera o tempObject mas deve sempre retornar o prev pois foi alterada a referência de memória
                // se retornar o tempObject vai retornar o objeto inicial;
                return prev;
            }, {}),
        );
        return parsed;
    }

    private async getTemplateKeyAndValue(templateId: string, values?: { key: string; value: string }[]) {
        const template = await this.model.findOne({ _id: templateId });
        if (!template) return null;

        const templateMessage = template.message;
        const matchs = Array.from(templateMessage.matchAll(/{{(.*?)}}/g), (m) => m[0]);

        const result: { key: string; value: string }[] = [];
        matchs?.forEach((match) => {
            let variable: string = match.replace(/{{/g, '');
            variable = variable.replace(/}}/g, '');
            const existAttrResult = result.find((currAttr) => currAttr.key === variable);
            if (values) {
                const attr = values.find((currValue) => currValue.key === variable);

                if (attr && !existAttrResult) {
                    result.push(attr);
                }
            }

            if (!values && !existAttrResult) {
                result.push({ key: variable, value: '' });
            }
        });

        if (template.buttons.length) {
            template.buttons.forEach((button, index) => {
                if (button?.url?.endsWith('{{1}}')) {
                    const key = `URL_${index}`;
                    if (values) {
                        const existAttrButton = values.find(
                            (currAttr) => currAttr.key.toLocaleLowerCase() === key.toLocaleLowerCase(),
                        );
                        if (existAttrButton) {
                            result.push(existAttrButton);
                        } else {
                            result.push({ key, value: '' });
                        }
                    } else {
                        result.push({ key, value: '' });
                    }
                }
            });
        }
        return result;
    }

    async getTemplateVariableValues(
        templateId: string,
        values?: { key: string; value: string }[],
    ): Promise<string[] | null> {
        const result = await this.getTemplateKeyAndValue(templateId, values);
        return result?.map((currAttr) => {
            return currAttr.value;
        });
    }

    async getTemplateVariableKeys(
        templateId: string,
        values?: { key: string; value: string }[],
    ): Promise<string[] | null> {
        const result = await this.getTemplateKeyAndValue(templateId, values);
        return result?.map((currAttr) => {
            return currAttr.key;
        });
    }

    async uploadFileTemplate(workspaceId: string, whoUserId: string, templateId: string, file: UploadingFile) {
        const template = await this.model.findOne({
            _id: templateId,
            workspaceId,
        });
        if (!template) {
            throw Exceptions.TEMPLATE_NOT_FOUND_FILE_UPLOAD;
        }
        if (template.fileKey && template.type === TemplateType.file) {
            try {
                await this.storageService.delete(template.fileKey);
            } catch (err) {
                console.log(err);
            }
        }
        const s3Key = `templates/${workspaceId}/${templateId}/${file.originalname}`;
        await this.storageService.upload(file.buffer, s3Key, file.mimetype, true);
        const fileViewUrl = `${process.env.API_URI}/public-template-file/${templateId}/view`;

        const updateData = {
            fileUrl: fileViewUrl,
            fileContentType: file.mimetype,
            fileOriginalName: file.originalname,
            fileKey: s3Key,
            fileSize: file.buffer.byteLength,
            type: TemplateType.file,
        };

        const result = await this.model.updateOne(
            {
                _id: template._id,
            },
            {
                $set: updateData,
            },
        );

        if (result.modifiedCount) await this.templateMessageHistoryService.create(whoUserId, template);
        return fileViewUrl;
    }

    async headRequestView(templateId: string) {
        const template = await this.model.findOne({ _id: templateId });

        if (template) {
            if (template.fileSize) {
                return {
                    'Content-Type': template.fileContentType,
                    'Content-Length': template.fileSize,
                };
            }
            const url = await this.storageService.getSignedUrl(template.fileKey);
            const response = await axios.get(url);
            return response.headers;
        }
        return null;
    }

    async view(templateId: string) {
        const template = await this.model.findOne({ _id: templateId });
        let url = null;
        if (templateId) {
            url = await this.storageService.getSignedUrl(template.fileKey);
        }
        return { url };
    }

    async updateTemplateApprovalStatusAndWhatsappIdV2(
        channelConfig: ChannelConfig,
        templateId: string,
        whatsappTemplateId: string,
        status: TemplateStatus,
        rejectedReason?: string,
        category?: TemplateCategory,
    ) {
        let elementName = templateId;
        let id = templateId;

        let active: boolean = false;
        if (status == TemplateStatus.APPROVED) {
            active = true;
        }

        let template: TemplateMessage;
        if (!isObjectIdOrHexString(templateId)) {
            template = await this.model.findOne({
                [`wabaResult.${channelConfig._id}.wabaTemplateId`]: whatsappTemplateId,
            });

            elementName = template?.wabaResult?.[castObjectIdToString(channelConfig._id)]?.elementName;
        } else {
            template = await this.model.findOne({ _id: templateId });
        }

        let prevStatus;
        if (template) {
            id = castObjectIdToString(template._id);
            prevStatus = template?.wabaResult?.[castObjectIdToString(channelConfig._id)]?.status;
        } else {
            id = undefined;
        }

        if (!id) {
            Sentry.captureEvent({
                message: 'TemplateService.updateTemplateApprovalStatusAndWhatsappId not found template',
                extra: {
                    payload: {
                        channelConfigToken: channelConfig.token,
                        templateId,
                        whatsappTemplateId,
                        status,
                        rejectedReason,
                        category,
                    },
                },
            });
            return;
        }

        const wabaResult: Partial<TemplateMessageChannel> = {
            channelConfigId: channelConfig._id as string,
            appName: channelConfig.configData.appName,
            elementName: elementName,
            wabaTemplateId: whatsappTemplateId,
            status: ((status?.toLowerCase?.() || status) as TemplateStatus) || prevStatus,
            rejectedReason,
        };

        if (category) {
            wabaResult.category = category;
        }

        const result = await this.model.updateOne(
            {
                _id: template._id,
            },
            [
                {
                    $set: {
                        active: {
                            $cond: {
                                if: {
                                    $eq: [true, '$active'],
                                },
                                then: true,
                                else: active,
                            },
                        },
                        [`wabaResult.${channelConfig._id}`]: {
                            ...wabaResult,
                        },
                    },
                },
            ],
        );

        if (result.modifiedCount) await this.templateMessageHistoryService.create(null, template);
    }

    @CatchError()
    async updateTemplateApprovalStatusAndWhatsappId(
        channelConfigToken: string,
        templateId: string,
        whatsappTemplateId: string,
        status: TemplateStatus,
        rejectedReason?: string,
        category?: TemplateCategory,
    ) {
        let elementName = templateId;
        let id = templateId;

        const channelConfig = await this.externalDataService.getOneByToken(channelConfigToken);
        let active: boolean = false;
        if (status == TemplateStatus.APPROVED) {
            active = true;
        }

        if (channelConfig.whatsappProvider) {
            return await this.updateTemplateApprovalStatusAndWhatsappIdV2(
                channelConfig,
                templateId,
                whatsappTemplateId,
                status,
                rejectedReason,
                category,
            );
        }

        let prevStatus;
        let template: TemplateMessage;
        if (!isObjectIdOrHexString(templateId)) {
            template = await this.model.findOne({ [`wabaResult.${channelConfig._id}.elementName`]: elementName });
        } else {
            template = await this.model.findOne({ _id: templateId });
        }

        if (template) {
            id = castObjectIdToString(template._id);
            prevStatus = template?.wabaResult?.[castObjectIdToString(channelConfig._id)]?.status;
        } else {
            id = undefined;
        }

        if (!id) {
            Sentry.captureEvent({
                message: 'TemplateService.updateTemplateApprovalStatusAndWhatsappId not found template',
                extra: {
                    payload: {
                        channelConfigToken,
                        templateId,
                        whatsappTemplateId,
                        status,
                        rejectedReason,
                        category,
                    },
                },
            });
            return;
        }

        const wabaResult: Partial<TemplateMessageChannel> = {
            channelConfigId: channelConfig._id as string,
            appName: channelConfig.configData.appName,
            elementName: elementName,
            wabaTemplateId: whatsappTemplateId,
            status: ((status?.toLowerCase?.() || status) as TemplateStatus) || prevStatus,
            rejectedReason,
        };

        if (category) {
            wabaResult.category = category;
        }

        const result = await this.model.updateOne(
            {
                _id: castObjectId(id),
            },
            [
                {
                    $set: {
                        active: {
                            $cond: {
                                if: {
                                    $eq: [true, '$active'],
                                },
                                then: true,
                                else: active,
                            },
                        },
                        [`wabaResult.${channelConfig._id}`]: {
                            ...wabaResult,
                        },
                    },
                },
            ],
        );

        if (result.modifiedCount) await this.templateMessageHistoryService.create(null, template);
    }

    async copyFileToAttachmentBucket(fileKey: string, newFileKey: string) {
        await this.storageService.copyToBucket(fileKey, newFileKey, process.env.AWS_ATTACHMENTS_BUCKET_NAME);
        await new Promise((res) => setTimeout(res, 200));
        await this.storageService.copyToCopyBucket(
            fileKey,
            newFileKey,
            process.env.AWS_ATTACHMENTS_BUCKET_NAME + '-copy',
        );
        await new Promise((res) => setTimeout(res, 1000));
    }

    @CatchError()
    async createTemplateChannelGupshup(
        workspaceId: string,
        templateId: string,
        whoUserId: string,
        channelConfigId: string,
        category?: TemplateCategory,
        allowTemplateCategoryChange?: boolean,
    ) {
        if (this.cacheService) {
            this.cacheService.remove(templateId).then().catch(console.log);
        }
        const template = await this.model.findOne({ _id: castObjectId(templateId) });
        if (!template) {
            throw Exceptions.NOT_FOUND;
        }

        const { templateAppNames } = await this.getAppNamesTemplateHsm(workspaceId, [channelConfigId]);

        if (!templateAppNames.length) {
            throw Exceptions.TEMPLATE_CHANNEL_APPNAME_NOT_FOUND;
        }

        let file: UploadingFile;
        let templateType: TemplateTypeGupshup;
        if (template?.fileKey && template?.fileUrl) {
            if (template.fileContentType?.startsWith?.('video')) {
                templateType = TemplateTypeGupshup.VIDEO;
            } else if (template.fileContentType?.startsWith?.('image')) {
                templateType = TemplateTypeGupshup.IMAGE;
            } else {
                templateType = TemplateTypeGupshup.DOCUMENT;
            }

            const response = await axios.get(encodeURI(template.fileUrl), {
                responseType: 'arraybuffer',
            });
            if (response.status > 300) {
                const bufferError = Buffer.from(response.data, 'binary');
                Sentry.captureEvent({
                    message: 'TemplateService.createTemplateChannelGupshup file download error',
                    extra: {
                        err: bufferError.toString(),
                    },
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Error gupshup', bufferError.toString());
                }
                return;
            }

            const fileName = template.fileOriginalName;
            const fileExtension = response.headers['content-type'].split('/')[1];

            if (!fileExtension) {
                Sentry.captureEvent({
                    message: 'template: invalid fileExtension',
                    extra: {
                        contentDisposition: response.headers['content-disposition'],
                        fileName,
                        fileExtension,
                    },
                });
            }

            const buffer = Buffer.from(response.data, 'binary');
            file = {
                buffer,
                encoding: '',
                mimetype: response.headers['content-type'],
                size: buffer.byteLength,
                originalname: fileName,
                extension: fileExtension,
            };
        }

        const templateCategory: TemplateCategory = category || TemplateCategory.UTILITY;

        let gupshupTemplateResult;
        try {
            gupshupTemplateResult = await this.externalDataService.createTemplateGupshup(
                templateAppNames[0],
                channelConfigId,
                template,
                allowTemplateCategoryChange,
                templateCategory,
                file ? file : undefined,
                templateType,
            );
        } catch (error) {
            console.log('ERROR CREATE TEMPLATE GUPSHUP: ', error);
            gupshupTemplateResult = { error: 'Error create template on gupshup' };
        }

        let wabaResult: WabaResultType = template.wabaResult || {};

        if (gupshupTemplateResult.status === 'success') {
            wabaResult[gupshupTemplateResult.channelConfigId] = {
                channelConfigId: gupshupTemplateResult.channelConfigId,
                appName: gupshupTemplateResult.appName,
                status: TemplateStatus.AWAITING_APPROVAL,
                elementName: castObjectIdToString(template._id),
                wabaTemplateId: gupshupTemplateResult.template.id,
                category: gupshupTemplateResult?.category || TemplateCategory.UTILITY,
            };
        } else {
            wabaResult[gupshupTemplateResult.channelConfigId] = {
                channelConfigId: gupshupTemplateResult.channelConfigId,
                appName: gupshupTemplateResult.appName,
                status: TemplateStatus.ERROR_ONSUBMIT,
                elementName: castObjectIdToString(template._id),
                rejectedReason: gupshupTemplateResult?.message,
                category: gupshupTemplateResult?.category || TemplateCategory.UTILITY,
            };
        }

        const updatedTemplate = await this.model.findOneAndUpdate(
            {
                _id: template._id,
            },
            {
                $push: {
                    channels: channelConfigId,
                },
                $set: {
                    [`wabaResult.${channelConfigId}`]: wabaResult[channelConfigId],
                },
            },
            { new: true },
        );

        if (updatedTemplate) await this.templateMessageHistoryService.create(whoUserId, template);
        return updatedTemplate;
    }

    @CatchError()
    async deleteTemplateChannelGupshup(templateId: string, whoUserId: string, channelConfigId: string) {
        if (this.cacheService) {
            this.cacheService.remove(templateId).then().catch(console.log);
        }
        const template = await this.model.findOne({ _id: castObjectId(templateId) });
        if (!template) {
            throw Exceptions.NOT_FOUND;
        }

        if (!template?.wabaResult?.[channelConfigId]?.appName) {
            throw Exceptions.TEMPLATE_CHANNEL_APPNAME_NOT_FOUND;
        }

        const templateInUse = await this.checkTemplateUsage(String(template.workspaceId), templateId);

        if (templateInUse) {
            throw Exceptions.TEMPLATE_IN_USE;
        }

        if (template.wabaResult[channelConfigId].status === TemplateStatus.ERROR_ONSUBMIT) {
            const result = await this.model.updateOne(
                { _id: template._id },
                {
                    $pull: {
                        channels: channelConfigId,
                    },
                    $unset: {
                        [`wabaResult.${channelConfigId}`]: '',
                    },
                },
            );

            if (result.modifiedCount) {
                await this.templateMessageHistoryService.create(whoUserId, template);
                return { ok: true };
            } else {
                return { ok: false };
            }
        }

        let gupshupTemplateResult;
        try {
            gupshupTemplateResult = await this.externalDataService.deleteTemplateGupshup(
                template.wabaResult[channelConfigId].appName,
                template.wabaResult[channelConfigId].elementName || castObjectIdToString(template._id),
            );
        } catch (error) {
            console.log('ERROR DELETE TEMPLATE HSM: ', error);
        }

        if (gupshupTemplateResult.status === 'success') {
            const result = await this.model.updateOne(
                { _id: template._id },
                {
                    $pull: {
                        channels: channelConfigId,
                    },
                    $unset: {
                        [`wabaResult.${channelConfigId}`]: '',
                    },
                },
            );

            if (result.modifiedCount) {
                await this.templateMessageHistoryService.create(whoUserId, template);
                return { ok: true };
            } else {
                return { ok: false };
            }
        }

        return { ok: false };
    }

    @CatchError()
    async updateTemplateWabaResult(templateId: string, whoUserId: string, data: TemplateMessage) {
        if (this.cacheService) {
            this.cacheService.remove(templateId).then().catch(console.log);
        }

        const template = await this.model.findOne({ _id: templateId });

        const result = await this.model.updateOne(
            {
                _id: templateId,
            },
            {
                $set: {
                    wabaResult: data.wabaResult,
                    channels: data.channels,
                    channelsBackup: data.channelsBackup,
                },
            },
            { new: true },
        );

        if (result.modifiedCount > 0) {
            await this.templateMessageHistoryService.create(whoUserId, template);
            return { ok: true };
        }

        return { ok: false };
    }

    @CatchError()
    async validateSendTemplateWithVariable(
        templateId: string,
        teamId: string,
        channelConfigId: string,
        workspaceId: string,
    ) {
        const templateMessage = await this.model.findOne({
            _id: templateId,
            isHsm: true,
            active: true,
            workspaceId,
            $and: [
                {
                    $or: [
                        { channels: { $exists: false } },
                        { channels: { $size: 0 } },
                        { channels: { $in: [channelConfigId] } },
                    ],
                },
                {
                    $or: [{ teams: { $exists: false } }, { teams: { $size: 0 } }, { teams: { $in: [teamId] } }],
                },
                {
                    $or: [{ variables: { $exists: false } }, { variables: { $size: 0 } }],
                },
                {
                    [`wabaResult.${channelConfigId}.status`]: { $eq: TemplateStatus.APPROVED },
                },
                {
                    $or: [
                        {
                            message: {
                                $not: { $regex: noOtherVariablesPattern },
                            },
                        },
                        {
                            message: {
                                $regex: onlyStandardVariablesPattern,
                            },
                        },
                    ],
                },
            ],
        });

        return !!templateMessage;
    }

    @CatchError()
    async findTemplateHsmWithoutVariablePersonalized(workspaceId: string, channelConfigId: string, user: User) {
        const query: any = {
            filter: {
                $and: [
                    {
                        workspaceId,
                        isHsm: true,
                    },
                    {
                        $or: [{ active: true }, { active: { $exists: false } }],
                    },
                    {
                        $and: [
                            {
                                $or: [
                                    { channels: { $exists: false } },
                                    { channels: { $size: 0 } },
                                    { channels: { $in: [channelConfigId] } },
                                ],
                            },
                            {
                                [`wabaResult.${channelConfigId}.status`]: { $eq: TemplateStatus.APPROVED },
                            },
                        ],
                    },
                    {
                        $or: [{ variables: { $exists: false } }, { variables: { $size: 0 } }],
                    },
                    {
                        $or: [
                            {
                                message: {
                                    $not: { $regex: noOtherVariablesPattern },
                                },
                            },
                            {
                                message: {
                                    $regex: onlyStandardVariablesPattern,
                                },
                            },
                        ],
                    },
                ],
            },
        };

        const workspaceAdmin = isWorkspaceAdmin(user, workspaceId);
        const isAnyAdmin = isAnySystemAdmin(user);

        if (workspaceAdmin || isAnyAdmin) {
            return await this.queryPaginate(query);
        }

        const rawTeams = await this.externalDataService.getTeamsByWorkspaceAndUser(
            workspaceId,
            castObjectIdToString(user._id),
        );
        const teamsIds: string[] = rawTeams.map((team) => team._id as string);

        query.filter.$and = [
            ...query.filter.$and,
            {
                $or: [{ teams: { $exists: false } }, { teams: { $size: 0 } }, { teams: { $in: [...teamsIds] } }],
            },
        ];

        return await this.queryPaginate(query);
    }

    @CatchError()
    async updateStatusToRejectedInWabaResultTemplate(
        workspaceId: string,
        templateId: string,
        whoUserId: string,
        channelConfigId?: string,
    ) {
        const template = await this.model.findOne({ _id: castObjectId(templateId), workspaceId });
        if (!template) {
            throw Exceptions.NOT_FOUND;
        }

        if (!template.isHsm || !template.wabaResult) {
            throw Exceptions.ERROR_UPDATE_TEMPLATE_MESSAGE_HSM;
        }

        let newWabaResult = {};
        for (const wabaResultKey of Object.keys(template.wabaResult)) {
            if (!!channelConfigId && channelConfigId !== wabaResultKey) {
                continue;
            }
            newWabaResult = {
                ...newWabaResult,
                [`wabaResult.${wabaResultKey}`]: {
                    ...template.wabaResult[wabaResultKey],
                    status: TemplateStatus.REJECTED,
                },
            };
        }

        let updatedTemplate = template;
        if (Object.keys(newWabaResult)?.length > 0) {
            updatedTemplate = await this.model.findOneAndUpdate(
                {
                    _id: template._id,
                },
                {
                    $set: {
                        active: false,
                        ...newWabaResult,
                    },
                },
            );
            if (updatedTemplate) await this.templateMessageHistoryService.create(whoUserId, template);
        }

        return updatedTemplate;
    }

    @CatchError()
    async syncWabaResultByGupshup(
        workspaceId: string,
        templateId: string,
        whoUserId: string,
        channelConfigId?: string,
    ) {
        const template = await this.model.findOne({ _id: castObjectId(templateId), workspaceId });
        if (!template) {
            throw Exceptions.NOT_FOUND;
        }

        if (!template.isHsm || !Object.keys(template.wabaResult)) {
            throw Exceptions.ERROR_SYNC_TEMPLATE_MESSAGE;
        }

        let newWabaResult = {};
        for (const wabaResultKey of Object.keys(template.wabaResult)) {
            if (!!channelConfigId && channelConfigId !== wabaResultKey) {
                continue;
            }
            if (template?.wabaResult[wabaResultKey].appName) {
                const templates = await this.externalDataService.listTemplateGupshup(
                    template.wabaResult[wabaResultKey].appName,
                );

                const gupshupTemplate = templates?.find(
                    (gTemplate) => gTemplate.elementName === template.wabaResult[wabaResultKey]?.elementName,
                );

                if (gupshupTemplate) {
                    newWabaResult = {
                        ...newWabaResult,
                        [`wabaResult.${wabaResultKey}`]: {
                            ...template.wabaResult[wabaResultKey],
                            status: gupshupTemplate?.status?.toLowerCase?.(),
                            rejectedReason: gupshupTemplate?.reason,
                            category: gupshupTemplate?.category || template.wabaResult[wabaResultKey].category,
                        },
                    };
                }
            }
        }

        let updatedTemplate = template;
        if (Object.keys(newWabaResult)?.length > 0) {
            updatedTemplate = await this.model.findOneAndUpdate(
                {
                    _id: template._id,
                },
                {
                    $set: {
                        ...newWabaResult,
                    },
                },
            );
            if (updatedTemplate) await this.templateMessageHistoryService.create(whoUserId, template);
        }

        return updatedTemplate;
    }

    @CatchError()
    async createDefaultTemplateHsm(workspaceId: string, user: User, channelConfigId: string, clientName: string) {
        const partialTemplate = [
            {
                name: 'podemos conversar',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem? Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'informações',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nEu gostaria de te repassar algumas informações referentes ao atendimento realizado conosco. Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'informações solicitação',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nPreciso repassar algumas informações referentes à sua solicitação. Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'informações autorização',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nPreciso repassar algumas informações referentes à sua autorização conforme sua solicitação. Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'informações consulta',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nPreciso repassar algumas informações referentes à sua consulta agendada conosco. Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'informações exame',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nPreciso repassar algumas informações referente ao seu exame agendado conosco. Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'envio de documentos',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nGostaria de falar sobre envio de documentos referentes ao atendimento realizado conosco. Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'sobre agendamento',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nGostaria de falar sobre o agendamento de consultas/exames que foram realizados. Podemos continuar nossa conversa por aqui?`,
            },
            {
                name: 'pedido médico',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\nPara dar sequência à sua solicitação, precisamos da foto do pedido médico e da carteira do convênio, para solicitarmos autorização junto ao convênio. Pode nos passar por aqui?`,
            },
            {
                name: 'atendimento',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\n\nPreciso repassar algumas informações referentes à sua solicitação. Podemos conversar por aqui?`,
            },
            {
                name: 'preparo',
                message: `Olá, meu nome é {{agent.name}}, sou da equipe de atendimento ${clientName}, tudo bem?\n\nPreciso repassar algumas informações referentes ao preparo do seu exame agendado conosco. Podemos continuar nossa conversa por aqui?`,
            },
        ];

        const defaultConfigTemplate = {
            active: false,
            isHsm: true,
            canEdit: false,
            message: '',
            name: '',
            tags: [],
            teams: [],
            channels: [castObjectId(channelConfigId)],
            variables: [],
            userId: castObjectId(user._id),
            workspaceId: castObjectId(workspaceId),
            category: TemplateCategory.UTILITY,
            buttons: [],
            aiSuggestion: true,
        };

        const templatesToCreate = partialTemplate.map((currTemplate) => {
            return {
                ...defaultConfigTemplate,
                ...currTemplate,
            };
        });

        for (const template of templatesToCreate) {
            await this._create({ ...template, user }, false);
        }

        return { ok: true };
    }

    async getTemplateById(templateId: string) {
        return await this.model.findOne({ _id: castObjectId(templateId) });
    }
}
