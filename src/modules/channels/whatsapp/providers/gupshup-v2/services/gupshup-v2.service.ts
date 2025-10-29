import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { WhatsappInterfaceService } from '../../../interfaces/whatsapp-service.interface';
import { GupshupV2UtilService } from './gupshup-util.service';
import { AxiosResponse } from 'axios';
import * as Sentry from '@sentry/node';
import {
    ResponseDefault,
    ResponseGetPreviewFlowUrl,
    ResponseMessageWhatsapp,
} from '../../../interfaces/response-message-whatsapp.interface';
import { ChannelData } from '../../../interfaces/channel-data.interface';
import { PayloadMessageWhatsapp } from '../../../interfaces/payload-message-whatsapp.interface';
import { CacheService } from '../../../../../_core/cache/cache.service';
import { Exceptions } from '../../../../../auth/exceptions';
import * as FormData from 'form-data';
import { CompleteChannelConfig } from '../../../../../channel-config/channel-config.service';
import { MetaWhatsappIncomingTemplateEvent, MetaWhatsappWebhookEvent } from 'kissbot-core';
import {
    TemplateCategory,
    TemplateLanguage,
} from '../../../../../../modules/template-message/schema/template-message.schema';
import {
    MetaWhatsappOutcomingBaseMessage,
    MetaWhatsappOutcomingMessageType,
    MetaWhatsappOutcomingTextContent,
    MetaWhatsappOutcomingImageMessage,
    MetaWhatsappOutcomingVideoMessage,
    MetaWhatsappOutcomingAudioMessage,
    MetaWhatsappOutcomingDocumentMessage,
    MetaWhatsappOutcomingReactionMessage,
    MetaWhatsappOutcomingInteractiveContent,
    MetaWhatsappOutcomingTemplateContent,
    MetaWhatsappOutcomingInteractiveMessage,
} from '../../dialog360/interfaces/meta-whatsapp-outcoming.interface';
import { Activity } from '../../../../../activity/interfaces/activity';
import { FileUploaderService } from '../../../../../../common/file-uploader/file-uploader.service';
import { UploadingFile } from '../../../../../../common/interfaces/uploading-file.interface';
import { TemplateVariable } from '../../../../../template-message/interface/template-message.interface';
import * as handlebars from 'handlebars';
import { set } from 'lodash';
import { InteractiveType, PayloadInteractiveFlowMessage } from '../interfaces/payload-message-gupshup-v2.interface';
import { ExternalDataService } from './external-data.service';
import { ResponseMessageGupshupV2 } from '../interfaces/response-message-gupshup-v2.interface';
interface AppData {
    token: string;
    appId: string;
}

export const defaultVariablesTemplate = [
    'agent.name',
    'conversation.iid',
    'conversation.createdAt',
    'user.name',
    'user.phone',
    'client.name',
];

export enum TemplateTypeGupshup {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    DOCUMENT = 'DOCUMENT',
    LOCATION = 'LOCATION',
}

@Injectable()
export class GupshupV2Service implements WhatsappInterfaceService {
    private readonly logger = new Logger(GupshupV2Service.name);
    private partnerEmail: string = process.env.GUPSHUP_PARTNER_EMAIL;
    private partnerPassword: string = process.env.GUPSHUP_PARTNER_PASSWORD;

    constructor(
        @Inject(forwardRef(() => GupshupV2UtilService)) private gupshupUtilService: GupshupV2UtilService,
        private readonly cacheService: CacheService,
        private readonly fileUploaderService: FileUploaderService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async handleIncomingMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        //@todo implementar handleIncomingMessage
    }

    async handleIncomingAck(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        //@todo implementar handleIncomingAck
    }

    async handleIncomingTemplateEvent(payload: any, channelConfigToken: string) {
        const event = payload?.entry?.[0]?.changes?.[0]?.field;

        if (event === 'template_category_update') {
            //@todo implementar handleIncomingTemplateEvent
            return null;
        }

        if (event === 'message_template_status_update') {
            //@todo implementar handleIncomingTemplateEvent
            return null;
        }

        console.log('GupshupV2Service Template event not found', payload);
        return;
    }

    async createTemplateMetaWhatsapp(
        channelConfig: CompleteChannelConfig,
        name: string,
        category: TemplateCategory,
        template: any,
        fileData?: any,
        file?: UploadingFile,
        templateType?: any,
        allowTemplateCategoryChange?: boolean,
    ): Promise<any> {
        if (!template?._id) {
            throw Exceptions.TEMPLATE_NOT_EXIST;
        }

        const appName = channelConfig.configData.appName;
        const channelConfigId = channelConfig._id;

        const instance = this.gupshupUtilService.getAxiosInstance();

        const readAuth = await instance.post(
            '/account/login',
            `email=${this.partnerEmail}&password=${this.partnerPassword}`,
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        /**
         * Verifica se o app esta com hsm ativado.
         */
        const apps = await instance.get(`/account/api/partnerApps`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const gsApp = apps.data?.partnerAppsList?.find((app) => {
            return app.name == appName;
        });

        if (!gsApp) {
            throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
        }

        const writetoken = await instance.get(`/app/${gsApp.id}/token`, {
            headers: {
                Connection: 'keep-alive',
                token: readAuth.data.token,
            },
        });

        const js = {};

        if (file && templateType !== TemplateTypeGupshup.TEXT && templateType !== TemplateTypeGupshup.LOCATION) {
            try {
                const form = new FormData();
                form.append('file', file.buffer, file.originalname);
                form.append('file_type', file.mimetype);

                const result = await instance.post(`/app/${gsApp.id}/upload/media`, form, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: writetoken.data.token.token,
                    },
                });

                const handleId = result?.data?.handleId?.message;

                if (handleId) {
                    js['exampleMedia'] = handleId;
                }
            } catch (err) {
                throw err;
            }
        }

        js['vertical'] = 'start';
        if (template.buttons.length) {
            js['vertical'] = 'BUTTON_CHECK';
            js['buttons'] = JSON.stringify(template.buttons);
        } else if (file) {
            js['vertical'] = 'Ticket update';
        }

        js['category'] = category || TemplateCategory.MARKETING;
        js['templateType'] = templateType || TemplateTypeGupshup.TEXT;
        js['languageCode'] = TemplateLanguage.pt_BR;
        js['enableSample'] = true;
        js['allowTemplateCategoryChange'] = allowTemplateCategoryChange;

        const { context_message, example_message } = this.onHandleBarsCompileMessage(
            template.message,
            template.variables || [],
        );

        if (context_message?.trim()) {
            js['content'] = context_message;
        }
        if (example_message.trim()) {
            js['example'] = example_message;
        }
        js['elementName'] = String(template._id);

        var prms = new URLSearchParams(js);

        try {
            const post = await instance.post(`/app/${gsApp.id}/templates`, prms.toString(), {
                headers: {
                    Connection: 'keep-alive',
                    token: writetoken.data.token.token,
                },
            });

            return { ...post.data, appName: appName, channelConfigId: channelConfigId };
        } catch (err) {
            Sentry.captureEvent({
                message: `${GupshupV2Service.name}.createTemplateMetaWhatsapp`,
                extra: {
                    error: err,
                },
            });
            if (err?.response?.data) {
                return { ...err.response.data, appName: appName, channelConfigId: channelConfigId };
            } else {
                throw err;
            }
        }
    }

    onHandleBarsCompileMessage(templateMessage: string, templateVariables: TemplateVariable[]) {
        let templateHandle = handlebars.compile(templateMessage);

        let example_vars = {
            agent: {
                name: 'Frederico',
            },
            conversation: {
                iid: '#1234',
                createdAt: '22/10/2020',
            },
            user: {
                name: 'João',
                phone: '(48)999887766',
            },
            // client: {
            //     name: 'clinica Botdesigner',
            // },
        };
        let template_vars: any = {};

        const variables: { [key: string]: number } = {};
        templateMessage.match(/{{(.*?)}}/g)?.forEach((string, index) => {
            let variable = string.replace(/{{/g, '');
            variable = variable.replace(/}}/g, '');
            const exist = templateVariables?.find((currVar) => currVar.value === variable);
            const isDefault = !!defaultVariablesTemplate.find((curr) => curr === variable);

            if (!variables[variable]) {
                const pos = Object.keys(variables)?.length + 1;
                variables[variable] = pos;
                set(template_vars, variable, '{{' + pos + '}}');

                if (!isDefault && exist) {
                    example_vars[variable] = exist?.sampleValue || 'example';
                }
            }
        });

        let context_message = templateHandle(template_vars);

        const te = handlebars.compile(templateMessage);
        let example_message = te(example_vars);

        return {
            context_message,
            example_message,
        };
    }

    async sendOutcomingTextMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.TEXT,
            text: {
                body: activity.text,
            } as MetaWhatsappOutcomingTextContent,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingListMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const attachment = activity.attachments?.[0];
        if (!attachment?.content?.buttons) {
            throw new Error('List message requires buttons in attachment');
        }

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.INTERACTIVE,
            interactive: {
                type: 'list',
                body: {
                    text: attachment.content.text || attachment.content.subtitle || activity.text || '',
                },
                action: {
                    button: attachment.content.buttonText || 'Ver Opções',
                    sections: [
                        {
                            title: attachment.content.title || 'Opções',
                            rows: attachment.content.buttons.slice(0, 10).map((button, index) => ({
                                id: button.value || button.title || `option_${index}`,
                                title: button.title.substring(0, 24), // WhatsApp limit: 24 characters
                                description: button.subtitle || button.displayText || '', // WhatsApp limit: 72 characters
                            })),
                        },
                    ],
                },
            } as MetaWhatsappOutcomingInteractiveContent,
        };

        // Adicionar header se disponível
        if (attachment.content.header || attachment.content.title) {
            data.interactive.header = {
                type: 'text',
                text: (attachment.content.header || attachment.content.title).substring(0, 60), // WhatsApp limit: 60 characters
            };
        }

        // Adicionar footer se disponível
        if (attachment.content.footer) {
            data.interactive.footer = {
                text: attachment.content.footer.substring(0, 60), // WhatsApp limit: 60 characters
            };
        }

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingAudioMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const mediaUrl = await this.getMediaUrl(activity);

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.AUDIO,
            audio: {
                link: mediaUrl,
            } as MetaWhatsappOutcomingAudioMessage,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingImageMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const mediaUrl = await this.getMediaUrl(activity);

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.IMAGE,
            image: {
                link: mediaUrl,
                caption: activity.text,
            } as MetaWhatsappOutcomingImageMessage,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingVideoMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const mediaUrl = await this.getMediaUrl(activity);

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.VIDEO,
            video: {
                link: mediaUrl,
                caption: activity.text,
            } as MetaWhatsappOutcomingVideoMessage,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingDocumentMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const mediaUrl = await this.getMediaUrl(activity);

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.DOCUMENT,
            document: {
                link: mediaUrl,
                caption: activity.text,
                filename: activity.attachmentFile?.name || activity.attachmentFile?.key,
            } as MetaWhatsappOutcomingDocumentMessage,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingReactionMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.REACTION,
            reaction: {
                message_id: activity.quoted || activity.data?.reactionHash,
                emoji: activity.text,
            } as MetaWhatsappOutcomingReactionMessage,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingFlowMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        // o envio de flow é apenas pela interface do v3 por isso esta igual em ambos os services gupshupV2 e gupshupV3

        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { partnerToken, appId } = channelData;
        const { activity } = payloadData;

        const attach = activity.attachments?.[0];
        const button = attach.content.buttons[0];
        const flowData = await this.externalDataService.getFlowDataWithFlow(button.value);

        const payload = {
            action: {
                name: 'flow',
                parameters: {
                    flow_action: 'navigate',
                    flow_cta: button?.title || 'Clique aqui!',
                    flow_id: flowData?.flow?.flowId,
                    flow_token: flowData?.flow?.id ? `${flowData.flow.id}` : undefined,
                    flow_message_version: '3',
                    flow_action_payload: {
                        screen: flowData.flowScreen || 'RECOMMEND',
                        data: Object.keys(flowData?.data || {}).length ? flowData.data : undefined,
                    },
                },
            },
            header: attach?.content?.title
                ? {
                      type: 'text',
                      text: attach?.content?.title,
                  }
                : undefined,
            body: {
                text: `${attach.content?.subtitle ? `${attach.content?.subtitle}\n` : ''}${
                    attach.content?.text ? attach.content?.text : ''
                }`,
            },
            footer: undefined,
            type: InteractiveType.flow,
        } as PayloadInteractiveFlowMessage;

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.INTERACTIVE,
            interactive: {
                ...payload,
            },
        } as MetaWhatsappOutcomingInteractiveMessage;
        let token = partnerToken;
        let partnerAppId = appId;
        if (!partnerToken || !appId) {
            const appdata = await this.getPartnerAppToken(channelData);
            token = appdata.token;
            partnerAppId = appdata.appId;
        }

        return await this.sendOutcomingMessage(partnerAppId, token, data);
    }

    async sendOutcomingButtonMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const attachment = activity.attachments?.[0];
        if (!attachment?.content?.buttons) {
            throw new Error('Button message requires buttons in attachment');
        }

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.INTERACTIVE,
            interactive: {
                type: 'button',
                header: attachment.content.title
                    ? {
                          type: 'text',
                          text: attachment.content.title,
                      }
                    : undefined,
                body: {
                    text: attachment.content.text || attachment.content.subtitle || '',
                },
                footer: attachment.content.subtitle
                    ? {
                          text: attachment.content.subtitle,
                      }
                    : undefined,
                action: {
                    buttons: attachment.content.buttons.map((button) => ({
                        type: 'reply',
                        reply: {
                            id: button.value,
                            title: button.title,
                        },
                    })),
                },
            } as MetaWhatsappOutcomingInteractiveContent,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async sendOutcomingTemplateMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);
        const components: any[] = [];

        if (activity?.attachmentFile?.key && activity?.attachmentFile?.contentType) {
            const mediaUrl = await this.fileUploaderService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });

            const fileName = activity?.attachmentFile?.name || activity?.attachmentFile?.key;

            let fileType: 'image' | 'video' | 'document';
            if (activity.attachmentFile.contentType.startsWith('image')) {
                fileType = 'image';
            } else if (activity.attachmentFile.contentType.startsWith('video')) {
                fileType = 'video';
            } else {
                fileType = 'document';
            }

            components.push({
                type: 'header',
                parameters: [
                    {
                        type: fileType,
                        [fileType]: {
                            link: mediaUrl,
                        },
                    },
                ],
            });
        }

        if (activity.data?.templateVariableValues?.length > 0) {
            components.push({
                type: 'body',
                parameters: activity.data.templateVariableValues.map((value) => ({
                    type: 'text',
                    text: value,
                })),
            });
        }

        const payload: MetaWhatsappOutcomingTemplateContent = {
            name: activity.templateId,
            language: {
                code: 'pt_BR',
            },
            components,
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.TEMPLATE,
            template: payload,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    async subscriptionV3(channelData: ChannelData, callbackUrl: string, modes?: string) {
        const appdata = await this.getPartnerAppToken(channelData);

        const body = {};
        body['modes'] = modes || 'SENT,ENQUEUED,DELIVERED,READ,DELETED,FLOWS,MESSAGE,PAYMENTS,ALL,OTHERS';
        body['tags'] = 'V3 Subscription';
        body['showOnUI'] = true;
        body['version'] = 3;
        body['url'] = callbackUrl;

        var payload = new URLSearchParams(body);

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .post(`/app/${appdata.appId}/subscription`, payload.toString(), {
                headers: {
                    Connection: 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.subscriptionV3',
                    extra: {
                        error: error,
                        channelData,
                        callbackUrl,
                    },
                });
                return {
                    error,
                    success: false,
                };
            });

        return {
            result: result.data,
            success: true,
        };
    }

    async createFlow(
        channelConfig: CompleteChannelConfig,
        flowData: {
            name: string;
            categories: string[];
        },
    ) {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const body = {
            name: flowData.name,
            categories: flowData.categories,
        };

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .post(`/app/${appdata.appId}/flows`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.createFlow',
                    extra: {
                        error: error,
                        channelData,
                        flowData,
                    },
                });
                console.error('Error GupshupV2Service.createFlow', { error: JSON.stringify(error) });
                return {
                    error,
                    success: false,
                };
            });

        return {
            result: result.data,
            success: true,
        };
    }

    async updateFlowJSON(channelConfig: CompleteChannelConfig, flowId: string, flowJSON: string) {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const formData = new FormData();
        const jsonBuffer = Buffer.from(flowJSON, 'utf-8');

        formData.append('file', jsonBuffer, {
            filename: 'flow.json',
            contentType: 'application/json',
        });

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .put(`/app/${appdata.appId}/flows/${flowId}/assets`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    accept: 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.updateFlowJSON',
                    extra: {
                        error: error,
                        channelConfig,
                        flowId,
                    },
                });
                console.error('Error GupshupV2Service.updateFlowJSON', { error: JSON.stringify(error) });
                return {
                    error,
                    success: false,
                };
            });

        return {
            result: result.data,
            success: true,
        };
    }

    async deprecateFlow(channelData: ChannelData, flowId: string) {
        const appdata = await this.getPartnerAppToken(channelData);

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .post(`/app/${appdata.appId}/flows/${flowId}`, null, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.deprecateFlow',
                    extra: {
                        error: error,
                        channelData,
                        flowId,
                    },
                });
                return {
                    error,
                    success: false,
                };
            });

        return {
            result: result.data,
            success: true,
        };
    }

    async deleteFlow(channelData: ChannelData, flowId: string) {
        const appdata = await this.getPartnerAppToken(channelData);

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .delete(`/app/${appdata.appId}/flows/${flowId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.deleteFlow',
                    extra: {
                        error: error,
                        channelData,
                        flowId,
                    },
                });
                return {
                    error,
                    success: false,
                };
            });

        return {
            result: result.data,
            success: true,
        };
    }

    async updateFlow(
        channelConfig: CompleteChannelConfig,
        flowId: string,
        flowData: {
            name: string;
            categories: string[];
        },
    ) {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const body = {
            name: flowData.name,
            categories: flowData.categories,
        };

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .put(`/app/${appdata.appId}/flows/${flowId}`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.updateFlow',
                    extra: {
                        error: error,
                        channelData,
                        flowId,
                    },
                });
                return {
                    error,
                    success: false,
                };
            });

        return {
            result: result.data,
            success: true,
        };
    }

    async publishFlow(channelConfig: CompleteChannelConfig, flowId: string) {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .post(`/app/${appdata.appId}/flows/${flowId}/publish`, null, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                this.logger.error('Error GupshupV2Service.publishFlow: ', error);
                console.log({ error: JSON.stringify(error) });
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.publishFlow',
                    extra: {
                        error: error,
                        channelConfig,
                        flowId,
                    },
                });
                return {
                    error,
                    success: false,
                };
            });

        return {
            result: result.data,
            success: true,
        };
    }

    async getPreviewFlowURL(channelConfig: CompleteChannelConfig, flowId: string): Promise<ResponseGetPreviewFlowUrl> {
        const channelData = await this.getPartnerAppToken(this.gupshupUtilService.getChannelData(channelConfig));

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result: any = await instance
            .get(`/app/${channelData.appId}/flows/${flowId}/preview`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: channelData.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.getPreviewFlowURL',
                    extra: {
                        error: error,
                        channelData,
                        flowId,
                    },
                });
                return error;
            });

        if (!result?.data) {
            return null;
        }
        return { id: result.data.id, preview: result.data.preview.preview_url };
    }

    async getFlowById(channelData: ChannelData, flowId: string) {
        const appdata = await this.getPartnerAppToken(channelData);

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result = await instance
            .get(`/app/${appdata.appId}/flows/${flowId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.getFlowById',
                    extra: {
                        error: error,
                        channelData,
                        flowId,
                    },
                });
                return error;
            });

        return result.data;
    }

    async getAllFlow(channelData: ChannelData) {
        const appdata = await this.getPartnerAppToken(channelData);

        const instance = this.gupshupUtilService.getAxiosInstance();

        const result = await instance
            .get(`/app/${appdata.appId}/flows`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.getAllFlow',
                    extra: {
                        error: error,
                        channelData,
                    },
                });
                return error;
            });

        return result.data;
    }

    async getFlowJSON(channelData: ChannelData, flowId: string) {
        const appdata = await this.getPartnerAppToken(channelData);
        const instance = this.gupshupUtilService.getAxiosInstance();

        const result = await instance
            .get(`/app/${appdata.appId}/flows/${flowId}/assets`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error GupshupV2Service.getFlowJSON',
                    extra: {
                        error: error,
                        channelData,
                    },
                });
                return error;
            });

        return result.data;
    }

    private async sendOutcomingMessage(
        appId: string,
        partnerAppToken: string,
        data: MetaWhatsappOutcomingBaseMessage,
    ): Promise<ResponseMessageWhatsapp> {
        this.logger.log('GupshupV2Service sendMessage:', { appId, partnerAppToken, data: JSON.stringify(data) });
        const instance = this.gupshupUtilService.getAxiosInstance();
        const response: AxiosResponse<ResponseMessageGupshupV2, any> = await instance.post(
            `/app/${appId}/v3/message`,
            data,
            {
                headers: {
                    'Cache-control': 'no-cache',
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: partnerAppToken,
                },
            },
        );
        this.handleAxiosError(response, 'GupshupV2Service - sendMessage');
        if (!response?.data) {
            return null;
        }

        return {
            msg_id: response.data.messages?.[0].id,
            contact: response.data.contacts?.[0],
        };
    }

    async sendOutcomingQuickReply(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const channelData = this.gupshupUtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const appData = await this.getPartnerAppToken(channelData);

        const attachment = activity.attachments?.[0];
        if (!attachment?.content?.buttons) {
            throw new Error('Quick reply message requires buttons in attachment');
        }

        // Para Quick Reply, usar estrutura mais simples sem header/footer
        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.INTERACTIVE,
            interactive: {
                type: 'button',
                body: {
                    text: attachment.content.text || attachment.content.subtitle || activity.text || '',
                },
                action: {
                    buttons: attachment.content.buttons.slice(0, 3).map((button, index) => ({
                        type: 'reply',
                        reply: {
                            id: button.value || button.title || `button_${index}`,
                            title: button.title.substring(0, 20), // WhatsApp limit: 20 characters
                        },
                    })),
                },
            } as MetaWhatsappOutcomingInteractiveContent,
        };

        return await this.sendOutcomingMessage(appData.appId, appData.token, data);
    }

    private async getPartnerAppToken(channelData: ChannelData, forceRestart?: boolean): Promise<AppData> {
        try {
            const { gupshupAppName: appName } = channelData;
            this.logger.log(`GupshupV2Service.getPartnerAppToken: ${appName}`);
            const key = `GS_APP_NAME_PARTNER_TOKEN:${appName}`;

            if (forceRestart) {
                await this.cacheService.remove(key);
            }
            let appData: AppData = await this.cacheService.get(key);
            if (appData && appData.appId && appData.token) {
                return appData;
            }

            const instance = this.gupshupUtilService.getAxiosInstance();

            const loginResult = await instance.post(
                '/account/login',
                encodeURI(`email=${this.partnerEmail}&password=${this.partnerPassword}`),
            );
            const partnerToken = loginResult.data.token;
            const partnerListResult = await instance.get('account/api/partnerApps', {
                headers: {
                    Connection: 'keep-alive',
                    token: partnerToken,
                },
            });

            const gsApp = partnerListResult.data?.partnerAppsList?.find((app) => {
                return app.name == appName;
            });

            if (!gsApp) {
                throw Exceptions.GUPSHUP_APPNAME_NOT_FOUND;
            }

            const partnerAppTokenResponse = await instance.get(`/app/${gsApp.id}/token`, {
                headers: {
                    Connection: 'keep-alive',
                    token: partnerToken,
                },
            });

            appData = { token: partnerAppTokenResponse.data.token.token, appId: gsApp.id };
            await this.cacheService.set(appData, key, 86400);
            return appData;
        } catch (e) {
            this.logger.error(`GupshupV2Service.getPartnerAppToken err: ${e}`);
        }
    }

    private handleAxiosError(response: AxiosResponse<any>, error: string) {
        class GupshupError extends Error {
            constructor(message: any, statusCode: number) {
                super(message);
                this.name = `GupshupError[status:${statusCode} error:${error}`;
            }
        }

        if (response?.status > 300) {
            this.logger.log(error);
            this.logger.log(JSON.stringify(response));
            return Sentry.captureException(new GupshupError(JSON.stringify(response.data), response.status));
        }
    }

    private async getMediaUrl(activity: Activity): Promise<string> {
        if (!activity.attachmentFile?.key) {
            throw new Error('Activity must have attachmentFile with key');
        }

        if (activity.attachmentFile.contentUrl && !activity.attachmentFile.contentUrl.startsWith(process.env.API_URI)) {
            return activity.attachmentFile.contentUrl;
        }

        const mediaUrl = await this.fileUploaderService.getAuthUrl(activity.attachmentFile.key, {
            fromCopyBucket: true,
        });

        return mediaUrl?.substring(0, mediaUrl?.lastIndexOf('?'));
    }
}
