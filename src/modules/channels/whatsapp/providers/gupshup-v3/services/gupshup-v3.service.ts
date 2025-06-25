import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MetaTemplateComponent, WhatsappInterfaceService } from '../../../interfaces/whatsapp-service.interface';
import { GupshupV3UtilService } from './gupshup-util.service';
import { AxiosResponse } from 'axios';
import * as Sentry from '@sentry/node';
import { PayloadMessageGupshupV3 } from '../interfaces/payload-message-gupshup-v3.interface';
import { ResponseMessageGupshupV3 } from '../interfaces/response-message-gupshup-v3.interface';
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
import { TemplateCategory } from 'src/modules/template-message/schema/template-message.schema';

interface AppData {
    token: string;
    appId: string;
}
@Injectable()
export class GupshupV3Service implements WhatsappInterfaceService {
    private readonly logger = new Logger(GupshupV3Service.name);
    private partnerEmail: string = '__';
    private partnerPassword: string = '__';

    constructor(
        @Inject(forwardRef(() => GupshupV3UtilService)) private gupshupUtilService: GupshupV3UtilService,
        private readonly cacheService: CacheService,
    ) {}

    async handleIncomingMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        // TODO: Implementar entrada de mensagens gupshupv3
    }

    async handleIncomingAck(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        // TODO: Implementar entrada de ack gupshupv3
    }

    async handleIncomingTemplateEvent(
        payload: MetaWhatsappIncomingTemplateEvent,
        channelConfigToken: string,
        workspaceId?: string,
    ) {
        // TODO: Implementar entrada de template gupshupv3
    }

    async createTemplateMetaWhatsapp(
        channelConfig: CompleteChannelConfig,
        name: string,
        category: TemplateCategory,
        components: MetaTemplateComponent[],
        fileData?: any,
    ): Promise<void> {
        return;
        // TODO: Implementar criação de template gupshupv3
    }

    async sendOutcomingTextMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { phone_destination, activity } = payloadData;
        // const payload = this.gupshupUtilService.transformActivityToPayloadGupshup(
        //     activity,
        //     PayloadGupshupTypes.PayloadTextMessage,
        // );
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.text,
        //     text: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingListMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { phone_destination, activity } = payloadData;
        // const payload = this.gupshupUtilService.transformActivityToPayloadGupshup(
        //     activity,
        //     PayloadGupshupTypes.PayloadTextMessage,
        // );
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.text,
        //     text: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingAudioMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.audio,
        //     audio: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingImageMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.image,
        //     image: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingVideoMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.video,
        //     video: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingDocumentMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.document,
        //     document: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingReactionMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.interactive,
        //     reaction: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingFlowMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
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

        // return await this.sendMessage(partnerAppId, token, data);
    }

    async sendOutcomingButtonMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.interactive,
        //     interactive: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
    }

    async sendOutcomingTemplateMessage(
        payloadData: PayloadMessageWhatsapp,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const { partnerToken, appId } = this.gupshupUtilService.getChannelData(channelConfig);
        // const { partnerToken, appId } = channelData;
        // const { phone_destination, payload } = payloadData;
        // const data: PayloadMessageGupshupV3 = {
        //     messaging_product: 'whatsapp',
        //     recipient_type: 'individual',
        //     to: phone_destination,
        //     type: MessageType.template,
        //     template: {
        //         ...payload,
        //     },
        // };
        // return await this.sendMessage(appId, partnerToken, data);
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
                    message: 'Error GupshupV3Service.subscriptionV3',
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
                    message: 'Error GupshupV3Service.createFlow',
                    extra: {
                        error: error,
                        channelData,
                        flowData,
                    },
                });
                console.error('Error GupshupV3Service.createFlow', { error: JSON.stringify(error) });
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
                    message: 'Error GupshupV3Service.updateFlowJSON',
                    extra: {
                        error: error,
                        channelConfig,
                        flowId,
                    },
                });
                console.error('Error GupshupV3Service.updateFlowJSON', { error: JSON.stringify(error) });
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
                    message: 'Error GupshupV3Service.deprecateFlow',
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
                    message: 'Error GupshupV3Service.deleteFlow',
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
                    message: 'Error GupshupV3Service.updateFlow',
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
                this.logger.error('Error GupshupV3Service.publishFlow: ', error);
                console.log({ error: JSON.stringify(error) });
                Sentry.captureEvent({
                    message: 'Error GupshupV3Service.publishFlow',
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
                    message: 'Error GupshupV3Service.getPreviewFlowURL',
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
                    message: 'Error GupshupV3Service.getFlowById',
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
                    message: 'Error GupshupV3Service.getAllFlow',
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
                    message: 'Error GupshupV3Service.getFlowJSON',
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
        data: PayloadMessageGupshupV3,
    ): Promise<ResponseMessageWhatsapp> {
        this.logger.log('GupshupV3Service sendMessage:', { appId, partnerAppToken, data: JSON.stringify(data) });
        const instance = this.gupshupUtilService.getAxiosInstance();
        const response: AxiosResponse<ResponseMessageGupshupV3, any> = await instance.post(
            `/app/${appId}/v3/message`,
            data,
            {
                headers: {
                    'Cache-control': 'no-cache',
                    'cache-control': 'no-cache',
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: partnerAppToken,
                },
            },
        );
        this.handleAxiosError(response, 'GupshupV3Service - sendMessage');
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
            this.logger.log(`GupshupV3Service.getPartnerAppToken: ${appName}`);
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
            this.logger.error(`GupshupV3Service.getPartnerAppToken err: ${e}`);
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
}
