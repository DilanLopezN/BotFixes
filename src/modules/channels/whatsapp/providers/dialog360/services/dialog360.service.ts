import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WhatsappInterfaceService } from '../../../interfaces/whatsapp-service.interface';
import { Dialog360UtilService } from './dialog360-util.service';
import { AxiosResponse } from 'axios';
import * as Sentry from '@sentry/node';
import { ResponseMessageDialog360 } from '../interfaces/response-message-dialog360.interface';
import {
    ResponseGetPreviewFlowUrl,
    ResponseMessageWhatsapp,
} from '../../../interfaces/response-message-whatsapp.interface';
import { ChannelData } from '../../../interfaces/channel-data.interface';
import { PayloadMessageWhatsapp } from '../../../interfaces/payload-message-whatsapp.interface';
import { CacheService } from '../../../../../_core/cache/cache.service';
import * as FormData from 'form-data';
import {
    MetaWhatsappOutcomingMessageType,
    MetaWhatsappOutcomingBaseMessage,
    MetaWhatsappOutcomingTextContent,
    MetaWhatsappOutcomingInteractiveContent,
    MetaWhatsappOutcomingInteractiveHeader,
    MetaWhatsappOutcomingAudioMessage,
    MetaWhatsappOutcomingReactionMessage,
    MetaWhatsappOutcomingImageMessage,
    MetaWhatsappOutcomingVideoMessage,
    MetaWhatsappOutcomingDocumentMessage,
    MetaWhatsappOutcomingTemplateContent,
} from '../interfaces/meta-whatsapp-outcoming.interface';
import { MetaWhatsappIncomingTemplateEvent, MetaWhatsappWebhookEvent } from 'kissbot-core';
import { ExternalDataService } from './external-data.service';
import { CompleteChannelConfig } from '../../../../../channel-config/channel-config.service';
import { Dialog360IncomingService } from './dialog360.incoming.service';
import { TemplateCategory } from 'src/modules/template-message/schema/template-message.schema';

interface AppData {
    token: string;
    appId: string;
}
@Injectable()
export class Dialog360Service implements WhatsappInterfaceService {
    private readonly logger = new Logger(Dialog360Service.name);
    private partnerEmail: string = '__';
    private partnerPassword: string = '__';

    constructor(
        private dialog360UtilService: Dialog360UtilService,
        private readonly cacheService: CacheService,
        private externalDataService: ExternalDataService,
        private readonly dialog360IncomingService: Dialog360IncomingService,
    ) {}

    async handleIncomingMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        await this.dialog360IncomingService.handleIncomingMessage(payload, channelConfigToken, workspaceId);
    }

    async handleIncomingAck(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        await this.dialog360IncomingService.handleIncomingAck(payload, channelConfigToken, workspaceId);
    }

    async handleIncomingTemplateEvent(payload: any, channelConfigToken: string) {
        const event = payload?.event;

        if (event === 'waba_template_category_changed') {
            return await this.dialog360IncomingService.handleIncomingTemplateCategoryChanged(
                payload as MetaWhatsappIncomingTemplateEvent,
                channelConfigToken,
            );
        }

        if (event === 'waba_template_status_changed') {
            return await this.dialog360IncomingService.handleIncomingTemplateStatusChanged(
                payload as MetaWhatsappIncomingTemplateEvent,
                channelConfigToken,
            );
        }

        console.log('Dialog360Service Template event not found', payload);
        return;
    }

    async sendOutcomingTextMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const payload: MetaWhatsappOutcomingTextContent = {
            body: activity.text,
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.TEXT,
            text: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async sendOutcomingQuickReply(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;
        const attach = activity.attachments[0];

        let header: MetaWhatsappOutcomingInteractiveHeader = null;

        let { mediaUrl, fileType, fileName } = await this.dialog360UtilService.getFileDetails(activity);
        if (mediaUrl && fileName && fileType) {
            header = {
                type: 'image',
                image: {
                    link: mediaUrl,
                },
            };
        } else if (attach.content?.title) {
            header = {
                type: 'text',
                text: attach.content?.title,
            };
        }

        const payload: MetaWhatsappOutcomingInteractiveContent = {
            type: 'button',
            header,
            body: {
                text: `${attach.content?.subtitle ? attach.content?.subtitle : ''}\n${
                    attach.content?.text ? attach.content?.text : ''
                }`,
            },
            action: {
                buttons: (attach.content.buttons || []).map((btn, index) => ({
                    type: 'reply',
                    reply: {
                        id: `${index + 1}`,
                        title: btn.title,
                    },
                })),
            },
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.INTERACTIVE,
            interactive: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async sendOutcomingListMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;
        const attach = activity.attachments[0];
        const payload: MetaWhatsappOutcomingInteractiveContent = {
            type: 'list',
            body: {
                text: `${attach.content?.subtitle ? attach.content?.subtitle : ''}\n${
                    attach.content?.text ? attach.content?.text : ''
                }`,
            },
            action: {
                button: `${attach?.content?.titleButtonList || 'Opções'}`,
                sections: [
                    {
                        title: attach.content.titleButtonList || '',
                        rows: (attach.content.buttons || []).map((button, index) => ({
                            id: `${index + 1}`,
                            title: button.title || '',
                            description: button.description || null,
                        })),
                    },
                ],
            },
        };

        if (attach?.content?.title) {
            payload.header = {
                type: 'text',
                text: attach?.content?.title,
            };
        }

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.INTERACTIVE,
            interactive: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async sendOutcomingAudioMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const mediaUrl: string = await this.getMediaUrl(activity);

        const payload: MetaWhatsappOutcomingAudioMessage = {
            link: mediaUrl,
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.AUDIO,
            audio: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async sendOutcomingImageMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const mediaUrl: string = await this.getMediaUrl(activity);

        const payload: MetaWhatsappOutcomingImageMessage = {
            link: mediaUrl,
            caption: activity.attachmentFile.caption || activity.text || '',
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.IMAGE,
            image: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async sendOutcomingVideoMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const mediaUrl: string = await this.getMediaUrl(activity);

        const payload: MetaWhatsappOutcomingVideoMessage = {
            link: mediaUrl,
            caption: activity.attachmentFile.caption,
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.VIDEO,
            video: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async sendOutcomingDocumentMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const mediaUrl: string = await this.getMediaUrl(activity);

        const payload: MetaWhatsappOutcomingDocumentMessage = {
            link: mediaUrl,
            caption: activity.attachmentFile.caption || activity.text || '',
            filename: activity.attachmentFile.name,
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.DOCUMENT,
            document: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async getMediaUrl(activity: any) {
        let mediaUrl: string = activity.attachmentFile.contentUrl;

        if (!mediaUrl || mediaUrl.startsWith(process.env.API_URI)) {
            mediaUrl = await this.externalDataService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });
            mediaUrl = mediaUrl.substring(0, mediaUrl.lastIndexOf('?'));
        }

        return mediaUrl;
    }

    async sendOutcomingReactionMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const payload: MetaWhatsappOutcomingReactionMessage = {
            message_id: activity.quoted,
            emoji: activity.text,
        };

        const data: MetaWhatsappOutcomingBaseMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: activity.to.phone,
            type: MetaWhatsappOutcomingMessageType.REACTION,
            reaction: payload,
        };

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
    }

    async sendOutcomingFlowMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageDialog360 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.interactive,
        //     interactive: {
        //         ...payload,
        //     },
        // };
        // let token = partnerToken;
        // let partnerAppId = appId;
        // if (!partnerToken || !appId) {
        //     const appdata = await this.getPartnerAppToken(channelData);
        //     token = appdata.token;
        //     partnerAppId = appdata.appId;
        // }
        // return await this.sendOutcomingMessageApi(partnerAppId, token, data);
    }

    async sendOutcomingButtonMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageDialog360 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.interactive,
        //     interactive: {
        //         ...payload,
        //     },
        // };
        // return await this.sendOutcomingMessageApi(appId, partnerToken, data);
    }

    async sendOutcomingTemplateMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { d360ApiKey } = this.dialog360UtilService.getChannelData(channelConfig);
        const { activity } = payloadData;

        const components = [];

        if (activity?.attachmentFile?.key && activity?.attachmentFile?.contentType) {
            const { mediaUrl, fileType } = await this.dialog360UtilService.getFileDetails(activity);

            if (mediaUrl) {
                components.push({
                    type: 'header',
                    parameters: [
                        {
                            type: fileType,
                            image: {
                                link: mediaUrl,
                            },
                        },
                    ],
                });
            }
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

        return await this.sendOutcomingMessageApi(d360ApiKey, data);
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

        const instance = this.dialog360UtilService.getAxiosInstance();

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
                    message: 'Error Dialog360Service.subscriptionV3',
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

    async createTemplateMetaWhatsapp(
        channelConfig: CompleteChannelConfig,
        name: string,
        category: TemplateCategory,
        template: any,
        fileData?: any,
    ): Promise<any> {
        const defaultVariablesTemplate = ['agent.name', 'conversation.iid', 'user.name', 'user.phone'];
        const channelData = await this.dialog360UtilService.getChannelData(channelConfig);

        const instance = this.dialog360UtilService.getAxiosInstance();

        const componentsPayload = [];

        if (fileData) {
            componentsPayload.push({
                type: 'HEADER',
                format: fileData.fileType,
                example: {
                    header_handle: [fileData.previewUrl],
                },
            });
        }

        if (template.message) {
            const defaultExampleValues = {
                'agent.name': 'Frederico',
                'conversation.iid': '#1234',
                'user.name': 'João',
                'user.phone': '(48)999887766',
            };

            const allVariables = template.message.match(/{{(.*?)}}/g)?.map((v) => v.replace(/[{}]/g, '')) || [];

            const orderedExamples = allVariables.map((variable) => {
                const isDefault = !!defaultVariablesTemplate.find((curr) => curr === variable);
                if (isDefault) {
                    return defaultExampleValues[variable] || variable;
                }
                const templateVar = template.variables?.find((v) => v.value === variable);
                return templateVar?.sampleValue || 'example';
            });

            const variableMap = new Map();
            allVariables.forEach((variable, index) => {
                variableMap.set(variable, index + 1);
            });

            let processedMessage = template.message;
            allVariables.forEach((variable) => {
                processedMessage = processedMessage.replace(`{{${variable}}}`, `{{${variableMap.get(variable)}}}`);
            });

            componentsPayload.push({
                type: 'BODY',
                text: processedMessage,
                ...(allVariables.length > 0 && {
                    example: {
                        body_text: [orderedExamples],
                    },
                }),
            });
        }

        if (template.buttons && template.buttons.length > 0) {
            componentsPayload.push({
                type: 'BUTTONS',
                buttons: template.buttons.map((button) => ({
                    type: button.type,
                    text: button.text,
                    ...(button.type === 'URL' && { url: button.url }),
                })),
            });
        }

        const templateData = {
            name,
            category,
            components: componentsPayload,
            allow_category_change: false,
            language: template.languageCode,
        };

        try {
            const response = await instance.post(`/v1/configs/templates`, templateData, {
                headers: {
                    'Content-Type': 'application/json',
                    'D360-API-KEY': channelData.d360ApiKey,
                },
            });

            return {
                ...response.data,
                appName: channelData.gupshupAppName || channelConfig.configData.appName,
                channelConfigId: channelConfig._id,
                whatsappProvider: 'd360',
            };
        } catch (error) {
            this.logger.error('Error creating template:', error);
            Sentry.captureEvent({
                message: 'Error Dialog360Service.createTemplateMetaWhatsapp',
                extra: {
                    error,
                    channelConfig,
                    name,
                    category,
                },
            });
            if (error?.response?.data) {
                return {
                    ...error.response.data,
                    message: error.response.data.rejected_reason,
                    appName: channelData.gupshupAppName || channelConfig.configData.appName,
                    channelConfigId: channelConfig._id,
                    whatsappProvider: 'd360',
                };
            } else {
                throw error;
            }
        }
    }

    async createFlow(
        channelConfig: CompleteChannelConfig,
        flowData: {
            name: string;
            categories: string[];
        },
    ) {
        const channelData = await this.dialog360UtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const body = {
            name: flowData.name,
            categories: flowData.categories,
        };

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result: any = await instance
            .post(`/app/${appdata.appId}/flows`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.createFlow',
                    extra: {
                        error: error,
                        channelData,
                        flowData,
                    },
                });
                console.error('Error Dialog360Service.createFlow', { error: JSON.stringify(error) });
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
        const channelData = await this.dialog360UtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const formData = new FormData();
        const jsonBuffer = Buffer.from(flowJSON, 'utf-8'); // Convertendo JSON para Buffer

        formData.append('file', jsonBuffer, {
            filename: 'flow.json',
            contentType: 'application/json',
        });

        const instance = this.dialog360UtilService.getAxiosInstance();

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
                    message: 'Error Dialog360Service.updateFlowJSON',
                    extra: {
                        error: error,
                        channelData,
                        flowId,
                    },
                });
                console.error('Error Dialog360Service.updateFlowJSON', { error: JSON.stringify(error) });
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

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result: any = await instance
            .post(`/app/${appdata.appId}/flows/${flowId}`, null, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.deprecateFlow',
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

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result: any = await instance
            .delete(`/app/${appdata.appId}/flows/${flowId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.deleteFlow',
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
        const channelData = await this.dialog360UtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const body = {
            name: flowData.name,
            categories: flowData.categories,
        };

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result: any = await instance
            .put(`/app/${appdata.appId}/flows/${flowId}`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.updateFlow',
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
        const channelData = await this.dialog360UtilService.getChannelData(channelConfig);
        const appdata = await this.getPartnerAppToken(channelData);

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result: any = await instance
            .post(`/app/${appdata.appId}/flows/${flowId}/publish`, null, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                this.logger.error('Error Dialog360Service.publishFlow: ', error);
                console.log({ error: JSON.stringify(error) });
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.publishFlow',
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

    async getPreviewFlowURL(channelConfig: CompleteChannelConfig, flowId: string): Promise<ResponseGetPreviewFlowUrl> {
        const appdata = await this.getPartnerAppToken(this.dialog360UtilService.getChannelData(channelConfig));

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result: any = await instance
            .get(`/app/${appdata.appId}/flows/${flowId}/preview`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.getPreviewFlowURL',
                    extra: {
                        error: error,
                        appdata,
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

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result = await instance
            .get(`/app/${appdata.appId}/flows/${flowId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.getFlowById',
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

        const instance = this.dialog360UtilService.getAxiosInstance();

        const result = await instance
            .get(`/app/${appdata.appId}/flows`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.getAllFlow',
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
        const instance = this.dialog360UtilService.getAxiosInstance();

        const result = await instance
            .get(`/app/${appdata.appId}/flows/${flowId}/assets`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: appdata.token,
                },
            })
            .catch((error) => {
                Sentry.captureEvent({
                    message: 'Error Dialog360Service.getFlowJSON',
                    extra: {
                        error: error,
                        channelData,
                    },
                });
                return error;
            });

        return result.data;
    }

    private async sendOutcomingMessageApi(
        partnerAppToken: string,
        data: MetaWhatsappOutcomingBaseMessage,
    ): Promise<ResponseMessageWhatsapp> {
        this.logger.log('Dialog360Service sendMessage:', { partnerAppToken, data: JSON.stringify(data) });
        const instance = this.dialog360UtilService.getAxiosInstance();
        const response: AxiosResponse<ResponseMessageDialog360, any> = await instance.post(`/messages`, data, {
            headers: {
                'Cache-control': 'no-cache',
                'cache-control': 'no-cache',
                accept: 'application/json',
                'Content-Type': 'application/json',
                // Authorization: partnerAppToken,
                'D360-API-KEY': partnerAppToken,
            },
        });
        this.handleAxiosError(response, 'Dialog360Service - sendMessage');

        if (!response?.data) {
            return null;
        }

        return {
            msg_id: response.data.messages?.[0].id,
            contact: response.data.contacts?.[0],
        };
    }

    private async getPartnerAppToken(channelData: ChannelData, forceRestart?: boolean): Promise<AppData> {
        try {
            const { gupshupAppName: appName } = channelData;
            this.logger.log(`Dialog360Service.getPartnerAppToken: ${appName}`);
            const key = `GS_APP_NAME_PARTNER_TOKEN:${appName}`;

            if (forceRestart) {
                await this.cacheService.remove(key);
            }
            let appData: AppData = await this.cacheService.get(key);
            if (appData && appData.appId && appData.token) {
                return appData;
            }

            const instance = this.dialog360UtilService.getAxiosInstance();

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
                throw new NotFoundException('App not found');
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
            this.logger.error(`Dialog360Service.getPartnerAppToken err: ${e}`);
        }
    }

    private handleAxiosError(response: AxiosResponse<any>, error: string) {
        class Dialog360Error extends Error {
            constructor(message: any, statusCode: number) {
                super(message);
                this.name = `Dialog360Error[status:${statusCode} error:${error}`;
            }
        }

        if (response?.status > 300) {
            this.logger.log(error);
            this.logger.log(JSON.stringify(response));
            return Sentry.captureException(new Dialog360Error(JSON.stringify(response.data), response.status));
        }
    }
}
