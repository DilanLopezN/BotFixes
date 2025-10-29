/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Injectable, Logger } from '@nestjs/common';
import { AckType, ActivityType, IResponseElementBillingCard } from 'kissbot-core';
import { CacheService } from './../../../_core/cache/cache.service';
import { Activity } from './../../../activity/interfaces/activity';
import { ChannelIdConfig } from './../../../channel-config/interfaces/channel-config.interface';
import { Conversation } from './../../../conversation/interfaces/conversation.interface';
import { EventsService } from './../../../events/events.service';
import { GupshupService } from './gupshup.service';
import { GupshupUtilService } from './gupshup-util.service';
import { FileUploaderService } from './../../../../common/file-uploader/file-uploader.service';
import { AxiosResponse } from 'axios';
import { isObjectIdOrHexString, Types } from 'mongoose';
import * as Sentry from '@sentry/node';
import { PrivateConversationDataService } from './../../../private-conversation-data/services/private-conversation-data.service';
import { CatchError, Exceptions } from './../../../auth/exceptions';
import { GupshupIdHashService } from './gupshup-id-hash.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../common/utils/prom-metrics';
import { castObjectIdToString } from '../../../../common/utils/utils';
import { ExternalDataService } from './external-data.service';
import { ChannelConfigService } from './../../../channel-config/channel-config.service';
import { PartnerApiService } from './partner-api.service';
interface GupshupData {
    apikey: string;
    phoneNumber: string;
    gupshupAppName: string;
}
@Injectable()
export class GupshupChannelConsumer {
    private readonly logger = new Logger(GupshupChannelConsumer.name);

    constructor(
        public readonly eventsService: EventsService,
        public cacheService: CacheService,
        private gupshupService: GupshupService,
        private gupshupUtilService: GupshupUtilService,
        private fileUploaderService: FileUploaderService,
        private privateDataService: PrivateConversationDataService,
        private readonly gupshupIdHashService: GupshupIdHashService,
        private readonly externalDataService: ExternalDataService,
        private readonly channelConfigService: ChannelConfigService,
        private readonly partnerApiService: PartnerApiService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: ChannelIdConfig.gupshup + '.outgoing',
        queue: ChannelIdConfig.gupshup + '.outgoing',
        queueOptions: {
            durable: true,
            channel: GupshupChannelConsumer.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async processEvent(event) {
        const timer = rabbitMsgLatency.labels(GupshupChannelConsumer.name).startTimer();
        rabbitMsgCounter.labels(GupshupChannelConsumer.name).inc();
        try {
            const activity: Activity = event.activity as Activity;
            const conversation: Conversation = event.conversation as Conversation;

            if (
                activity.type != ActivityType.message &&
                activity.type != ActivityType.member_upload_attachment &&
                activity.type != ActivityType.rating_message
            ) {
                return;
            }

            let response: { messageId: string };
            try {
                try {
                    if (activity?.attachments?.[0]?.contentType == 'billing_card') {
                        response = await this.sendBillingMessageToGupshup(conversation, activity);
                    } else if (activity.isHsm && activity.data?.wabaTemplateId) {
                        response = await this.sendTemplateMessage(activity);
                    } else if (
                        activity.attachments?.[0]?.content?.buttons.length === 1 &&
                        activity.attachments?.[0]?.content?.buttons?.[0]?.type === 'flow'
                    ) {
                        const channelConfig = await this.externalDataService.getChannelConfig(conversation.token);
                        response = await this.externalDataService.sendFlowMessage(activity, channelConfig);
                    } else if (
                        activity.attachments?.[0]?.content?.buttons.length === 1 &&
                        activity.attachments?.[0]?.content?.buttons?.[0]?.type === 'openUrl'
                    ) {
                        response = await this.sendCtaURLMessageToGupshup(conversation, activity);
                    } else if (
                        activity.attachments?.[0]?.content?.buildAsQuickReply &&
                        activity?.attachments?.[0]?.content?.buttons?.length <= 3
                    ) {
                        response = await this.sendQuickReplyMessageToGupshup(conversation, activity);
                    } else if (
                        activity?.attachments?.[0]?.content?.buildAsList &&
                        activity?.attachments?.[0]?.content?.buttons?.length <= 10
                    ) {
                        response = await this.sendListMessageToGupshup(conversation, activity);
                    } else {
                        if (activity.attachmentFile) {
                            response = await this.sendMediaMessageToGupshup(conversation, activity);
                        } else if (activity.text) {
                            if (activity?.data?.reactionHash) {
                                response = await this.sendReactionMessageToGupshup(conversation, activity);
                            } else {
                                response = await this.sendTextMessageToGupshup(conversation, activity);
                            }
                        }
                    }
                } catch (e) {
                    const m = `${GupshupChannelConsumer.name}.processEvent`;
                    this.logger.error(m);
                    console.log(e);
                    Sentry.captureEvent({
                        message: m,
                        extra: {
                            error: e,
                            event,
                        },
                    });
                    // if (activity.attachmentFile) {
                    //     response = await this.sendMediaMessageToGupshup(conversation, activity);
                    // } else if (activity.text) {
                    //     if (activity?.data?.reactionHash) {
                    //         response = await this.sendReactionMessageToGupshup(conversation, activity);
                    //     } else {
                    //         response = await this.sendTextMessageToGupshup(conversation, activity);
                    //     }
                    // } else if (activity.attachments?.length) {
                    //     if (
                    //         activity.attachments[0].content.buttons.length === 1 &&
                    //         activity.attachments[0].content?.buttons?.[0]?.type === 'openUrl'
                    //     ) {
                    //         response = await this.sendCtaURLMessageToGupshup(conversation, activity);
                    //     } else if (activity.attachments[0]?.content?.buttons?.length <= 3) {
                    //         response = await this.sendQuickReplyMessageToGupshup(conversation, activity);
                    //     } else if (activity.attachments[0]?.content?.buttons?.length <= 10) {
                    //         response = await this.sendListMessageToGupshup(conversation, activity);
                    //     }
                    // }
                }

                if (!response) {
                    this.logger.error('Error on send:' + JSON.stringify(activity));
                    this.logger.error('Error on send2:' + JSON.stringify(response));
                    //return Sentry.captureException(JSON.stringify(activity));
                }

                await this.gupshupUtilService.setGupshupIdHash(response.messageId, activity.hash);
                await this.gupshupIdHashService.create({
                    gsId: response.messageId,
                    hash: activity.hash,
                    conversationId: castObjectIdToString(conversation._id),
                    workspaceId: conversation.workspace?._id,
                });

                if (activity.data) {
                    activity.data.gsId = response.messageId;
                } else {
                    activity.data = { gsId: response.messageId };
                }

                await this.afterSendedMessage(activity, conversation.token);
            } catch (e) {
                rabbitMsgCounterError.labels(GupshupChannelConsumer.name).inc();
                if (e?.response?.status > 300) {
                    this.logger.warn('Error on sending message to gupshup:', e?.response?.data || e?.response || e);
                    await this.gupshupService.updateActivityAck(
                        activity.hash,
                        AckType.SendingToGupshupRequestError,
                        conversation.token,
                    );
                }
                this.logger.error('GupshupChannelConsumer.registerChannel');
                this.logger.error(e);
            }
        } catch (e) {
            console.log('Error on GupshupChannelConsumer', e);
            rabbitMsgCounterError.labels(GupshupChannelConsumer.name).inc();
        }
        timer();
    }

    private async afterSendedMessage(activity: Activity, token: string) {
        /*

        --> Não esta sendo usado.

        try {

            let key = 'gupshup:' + moment().utc().startOf('day').format('YYYYMMDD') + ':sended';
            const client = await this.cacheService.getClient();
            const count = await client.zincrby(key, 1, token);
            if (count == '1') {
                client.expire(key, 86400 * 35);
            }

            key = 'gupshup:msg:' + token + ':' + activity.to.id + ':sended';
            const c = await client.hset(key, activity.hash, JSON.stringify(activity));
            if (c == 1) {
                client.expire(key, 86400 * 1);
            }
            
        } catch (e) {
            console.log(e);
        }

        */
    }

    private async sendTextMessageToGupshup(conversation: Conversation, activity: Activity) {
        if (!activity.text) {
            console.log('ERROR UNDEFINED TEXT', JSON.stringify(activity));
        }
        const gupshupData = await this.getGupshupAccountInfos(
            castObjectIdToString(conversation._id),
            conversation.token,
        );
        const destination = activity.to.id;
        const message: any = {
            isHSM: `${!!activity.isHsm}`,
            type: 'text',
            text: activity.text,
            filename: '',
        };

        if (activity.quoted) {
            let gsId = activity.quoted;

            if (isObjectIdOrHexString(gsId)) {
                const resultGsId = await this.gupshupIdHashService.findGsIdByHash(activity.quoted);
                if (resultGsId) {
                    gsId = resultGsId;
                }
            }

            message.context = { msgId: gsId };
        }

        const source = await this.getSource(gupshupData?.phoneNumber);
        const serializedBody: string = `channel=whatsapp&source=${source}&destination=${destination}&message=${encodeURIComponent(
            JSON.stringify(message),
        )}&disablePreview=true&src.name=${gupshupData.gupshupAppName}`;
        if (activity.isHsm) {
            if (activity.data?.wabaTemplateId) {
                try {
                    return this.sendTemplateMessage(activity, gupshupData);
                } catch (e) {
                    Sentry.captureEvent({
                        message: `${GupshupChannelConsumer.name}.sendTextMessageToGupshup error sendTemplateMessage: `,
                        extra: {
                            error: e,
                        },
                    });
                    console.log('sendTextMessageToGupshup error sendTemplateMessage: ', JSON.stringify(e));
                    return await this.sendMessage(gupshupData?.apikey, serializedBody);
                }
            }
        }
        return await this.sendMessage(gupshupData?.apikey, serializedBody);
    }

    private async sendReactionMessageToGupshup(conversation: Conversation, activity: Activity) {
        try {
            if (!activity.text || !activity.quoted) {
                console.log('ERROR UNDEFINED TEXT', JSON.stringify(activity));
                return;
            }

            let gsId = activity.quoted;

            if (isObjectIdOrHexString(gsId)) {
                const resultGsId = await this.gupshupIdHashService.findGsIdByHash(activity.quoted);
                if (resultGsId) {
                    gsId = resultGsId;
                }
            }
            const gupshupData = await this.getGupshupAccountInfos(
                castObjectIdToString(conversation._id),
                conversation.token,
            );
            const destination = activity.to.id;
            const message = {
                type: 'reaction',
                emoji: activity.text,
                msgId: gsId,
            };
            const source = await this.getSource(gupshupData?.phoneNumber);
            const serializedBody: string = `channel=whatsapp&source=${source}&destination=${destination}&message=${encodeURIComponent(
                JSON.stringify(message),
            )}&disablePreview=true&src.name=${gupshupData.gupshupAppName}`;

            return await this.sendMessage(gupshupData?.apikey, serializedBody);
        } catch (error) {
            console.log('ERROR GupshupChannelConsumer.sendReactionMessageToGupshup: ', error);
        }
    }

    private async sendQuickReplyMessageToGupshup(conversation: Conversation, activity: Activity) {
        const gupshupData = await this.getGupshupAccountInfos(
            castObjectIdToString(conversation._id),
            conversation.token,
        );
        const destination = activity.to.id;
        const attach = activity.attachments[0];

        let content: any = {
            type: 'text',
            header: attach.content?.title,
            text: `${attach.content?.subtitle ? attach.content?.subtitle : ''}\n${
                attach.content?.text ? attach.content?.text : ''
            }`,
        };

        let { mediaUrl, fileType, fileName } = await this.getFileDetails(activity);
        if (mediaUrl && fileName && fileType) {
            content.type = fileType;
            content.url = mediaUrl;
            content.fileName = fileName;
        }

        try {
            if (attach.content?.footer) {
                content.caption = attach?.content?.footer;
            }
        } catch (e) {
            console.log('ERRO BUILD CAPTION ON QUICK_REPLY', e);
        }

        const options = (attach.content.buttons || []).map((btn, index) => {
            return {
                type: 'text',
                title: btn.title,
                postbackText: `${index + 1}`,
            };
        });

        const message = {
            type: 'quick_reply',
            content,
            options,
            // msgid: 'qr1',
        };
        const source = await this.getSource(gupshupData?.phoneNumber);
        const serializedBody: string = `channel=whatsapp&source=${source}&destination=${destination}&message=${encodeURIComponent(
            JSON.stringify(message),
        )}&src.name=${gupshupData.gupshupAppName}`;

        return await this.sendMessage(gupshupData?.apikey, serializedBody);
    }

    private async sendListMessageToGupshup(conversation: Conversation, activity: Activity) {
        const gupshupData = await this.getGupshupAccountInfos(
            castObjectIdToString(conversation._id),
            conversation.token,
        );
        const destination = activity.to.id;
        const attach = activity.attachments[0];

        const options = (attach.content.buttons || []).map((btn, index) => {
            return {
                type: 'text',
                title: btn.title,
                description: btn?.description || '',
                postbackText: `${index + 1}`,
                encodeText: true,
            };
        });

        let message: any = {
            type: 'list',
            title: attach.content?.title || '',
            body: `${attach.content?.subtitle ? attach.content?.subtitle : ''}\n${
                attach.content?.text ? attach.content?.text : ''
            }`,
            msgid: activity._id,
            globalButtons: [{ type: 'text', title: attach?.content?.titleButtonList || 'Ver opções' }],
            items: [{ options }],
        };

        try {
            if (attach.content?.footer) {
                message.footer = attach?.content?.footer;
            }
        } catch (e) {
            console.log('ERRO BUILD CAPTION ON LIST', e);
        }

        const source = await this.getSource(gupshupData?.phoneNumber);
        const serializedBody: string = `channel=whatsapp&source=${source}&destination=${destination}&message=${encodeURIComponent(
            JSON.stringify(message),
        )}&src.name=${gupshupData.gupshupAppName}`;

        return await this.sendMessage(gupshupData?.apikey, serializedBody);
    }

    private async getFileDetails(activity: Activity) {
        if (!activity?.attachmentFile) {
            return { mediaUrl: null, fileType: null, fileName: null };
        }

        let mediaUrl: string = activity?.attachmentFile?.contentUrl;

        const fileName = activity?.attachmentFile?.name || activity?.attachmentFile?.key;

        if (!mediaUrl || mediaUrl.startsWith(process.env.API_URI)) {
            mediaUrl = await this.fileUploaderService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });
            mediaUrl = mediaUrl.substring(0, mediaUrl.lastIndexOf('?'));
        }
        let gupshupTemplateType;

        if (activity.attachmentFile.contentType.startsWith('image')) {
            gupshupTemplateType = 'image';
        } else if (activity.attachmentFile.contentType.startsWith('video')) {
            gupshupTemplateType = 'video';
        } else {
            gupshupTemplateType = 'file';
        }

        return { mediaUrl, fileType: gupshupTemplateType, fileName };
    }

    private async sendCtaURLMessageToGupshup(conversation: Conversation, activity: Activity) {
        try {
            const gupshupData = await this.getGupshupAccountInfos(
                castObjectIdToString(conversation._id),
                conversation.token,
            );
            const destination = activity.to.id;
            const attach = activity.attachments[0];
            const button = attach.content.buttons[0];
            let header = undefined;

            let { mediaUrl, fileType } = await this.getFileDetails(activity);
            if (mediaUrl && (fileType === 'image' || fileType === 'video')) {
                header = {
                    type: fileType,
                    [fileType]: { link: mediaUrl },
                };
            }

            let message: any = {
                type: 'cta_url',
                header,
                body: `${attach.content?.title ? `*${attach.content?.title}*\n\n` : ''}${
                    attach.content?.subtitle ? attach.content?.subtitle : ''
                }\n${attach.content?.text ? attach.content?.text : ''}`,
                display_text: button?.title?.slice?.(0, 20) || 'Clique aqui!',
                url: button?.value || '',
            };

            try {
                if (attach.content?.footer) {
                    message.footer = attach?.content?.footer;
                }
            } catch (e) {
                console.log('ERRO BUILD FOOTER ON CTA_URL', e);
            }

            const source = await this.getSource(gupshupData?.phoneNumber);
            const serializedBody: string = `channel=whatsapp&source=${source}&destination=${destination}&message=${encodeURIComponent(
                JSON.stringify(message),
            )}&src.name=${gupshupData.gupshupAppName}`;

            return await this.sendMessage(gupshupData?.apikey, serializedBody);
        } catch (error) {
            console.log('ERROR GupshupChannelConsumer.sendCtaURLMessageToGupshup: ', error);
        }
    }

    private async sendMediaMessageToGupshup(conversation: Conversation, activity: Activity) {
        let message: string;

        let gsId;
        if (activity.quoted) {
            gsId = activity.quoted;
            if (isObjectIdOrHexString(gsId)) {
                const resultGsId = await this.gupshupIdHashService.findGsIdByHash(activity.quoted);
                if (resultGsId) {
                    gsId = resultGsId;
                }
            }
        }

        let mediaUrl: string = activity.attachmentFile.contentUrl;

        const fileName = activity.attachmentFile.name || activity.attachmentFile.key;

        if (!mediaUrl || mediaUrl.startsWith(process.env.API_URI)) {
            mediaUrl = await this.fileUploaderService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });
            mediaUrl = mediaUrl.substring(0, mediaUrl.lastIndexOf('?'));
        }
        let gupshupTemplateType;

        if (activity.attachmentFile.contentType.startsWith('image')) {
            gupshupTemplateType = 'image';
            message = encodeURIComponent(
                JSON.stringify({
                    type: 'image',
                    previewUrl: mediaUrl,
                    originalUrl: mediaUrl,
                    caption: activity?.text || '',
                    filename: fileName,
                    ...(gsId ? { context: { msgId: gsId } } : {}),
                }),
            );
        } else if (activity.attachmentFile.contentType.startsWith('video')) {
            gupshupTemplateType = 'video';
            message = encodeURIComponent(
                JSON.stringify({
                    type: 'video',
                    url: mediaUrl,
                    caption: activity?.text || '',
                    filename: fileName,
                    ...(gsId ? { context: { msgId: gsId } } : {}),
                }),
            );
        } else if (activity.attachmentFile.contentType.startsWith('audio')) {
            // gupshupTemplateType = 'audio'; // gupshup não permite audio como template
            message = encodeURIComponent(
                JSON.stringify({
                    type: 'audio',
                    url: mediaUrl,
                    filename: fileName,
                    ...(gsId ? { context: { msgId: gsId } } : {}),
                }),
            );
        } else {
            gupshupTemplateType = 'document';
            message = encodeURIComponent(
                JSON.stringify({
                    type: 'file',
                    url: mediaUrl,
                    caption: activity?.text || '',
                    filename: fileName,
                    ...(gsId ? { context: { msgId: gsId } } : {}),
                }),
            );
        }

        const gupshupData = await this.getGupshupAccountInfos(
            castObjectIdToString(conversation._id),
            conversation.token,
        );

        if (activity.isHsm) {
            if (activity.data?.wabaTemplateId) {
                return this.sendTemplateMessage(activity, gupshupData, {
                    gupshupTemplateType,
                });
            }
        }

        const destination = activity.to.id;
        const source = await this.getSource(gupshupData?.phoneNumber);
        const serializedBody = `channel=whatsapp&source=${source}&destination=${destination}&message=${message}&src.name=${gupshupData.gupshupAppName}`;
        const data = await this.sendMessage(gupshupData?.apikey, serializedBody);

        return data;
    }

    private async sendMessage(apikey: string, serializedBody: string) {
        const instance = this.gupshupUtilService.getAxiosInstance();
        const response = await instance.post('https://api.gupshup.io/wa/api/v1/msg', serializedBody, {
            headers: {
                apikey: apikey,
                'Cache-control': 'no-cache',
                'cache-control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        this.handleAxiosError(response, 'sendMessage');
        return response?.data;
    }

    @CatchError()
    private async sendTemplateMessage(activity: Activity, gupshupData?: GupshupData, fileData?: any) {
        if (!gupshupData) {
            gupshupData = await this.getGupshupAccountInfos(castObjectIdToString(activity.conversationId));
        }

        const destination = activity.to.id;
        const template = {
            id: activity.data.wabaTemplateId,
            params: activity.data.templateVariableValues,
        };
        let message;
        if (fileData) {
            const mediaUrl = await this.fileUploaderService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });
            const fileName = activity?.attachmentFile?.name || activity?.attachmentFile?.key;
            message = {
                type: fileData.gupshupTemplateType,
                [fileData.gupshupTemplateType]: { link: mediaUrl, filename: fileName },
            };
        } else if (activity?.attachmentFile?.key && activity?.attachmentFile?.contentType) {
            let gupshupTemplateType;

            if (activity.attachmentFile.contentType.startsWith('image')) {
                gupshupTemplateType = 'image';
            } else if (activity.attachmentFile.contentType.startsWith('video')) {
                gupshupTemplateType = 'video';
            } else {
                gupshupTemplateType = 'document';
            }
            const mediaUrl = await this.fileUploaderService.getAuthUrl(activity.attachmentFile.key, {
                fromCopyBucket: true,
            });
            const fileName = activity?.attachmentFile?.name || activity?.attachmentFile?.key;
            message = {
                type: gupshupTemplateType,
                [gupshupTemplateType]: { link: mediaUrl, filename: fileName },
            };
        }

        const source = await this.getSource(gupshupData?.phoneNumber);
        let serializedBody = `source=${source}&destination=${destination}&template=${encodeURIComponent(
            JSON.stringify(template),
        )}`;

        if (message) {
            serializedBody = serializedBody + `&message=${encodeURIComponent(JSON.stringify(message))}`;
        }
        const instance = this.gupshupUtilService.getAxiosInstance();
        const response = await instance.post('https://api.gupshup.io/wa/api/v1/template/msg', serializedBody, {
            headers: {
                apikey: gupshupData?.apikey,
                'Cache-control': 'no-cache',
                'cache-control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        this.handleAxiosError(response, 'sendMessage');
        return response?.data;
    }

    handleAxiosError(response: AxiosResponse<any>, error: string) {
        class GupshupError extends Error {
            constructor(message: any, statusCode: number) {
                super(message);
                this.name = `GupshupError[status:${statusCode} error:${error}`;
            }
        }

        if (response?.status > 300) {
            return Sentry.captureException(new GupshupError(JSON.stringify(response.data), response.status));
        }
    }

    async getSource(source: string): Promise<string> {
        try {
            if (source == '5531971867073') {
                const newSource = await this.cacheService.get('GS:5531971867073');
                if (newSource) {
                    source = '553171867073';
                }
            }
            if (source == '5548999089492') {
                const newSource = await this.cacheService.get('GS:5548999089492');
                if (newSource) {
                    source = '554899089492';
                }
            }
            if (source == '5591988145190') {
                const newSource = await this.cacheService.get('GS:5591988145190');
                if (newSource) {
                    source = '559188145190';
                }
            }
            if (source == '5548933809413') {
                const newSource = await this.cacheService.get('GS:5548933809413');
                if (newSource) {
                    source = '554833809413';
                }
            }
        } catch (e) {
            console.log('GupshupChannelConsumer.getSource', e, source);
            Sentry.captureEvent({
                message: 'GupshupChannelConsumer.getSource',
                extra: {
                    error: e,
                    source,
                },
            });
        }
        return source;
    }

    async getGupshupAccountInfos(conversationId: string | Types.ObjectId, token?: string) {
        try {
            if (token) {
                // Obter as informações diretamente do channelConfig usando o token
                const channelConfig = await this.channelConfigService.getOneBtIdOrToken(token);
                if (channelConfig && channelConfig.configData) {
                    return {
                        apikey: channelConfig.configData.apikey,
                        phoneNumber: channelConfig.configData.phoneNumber,
                        gupshupAppName: channelConfig.configData.appName,
                    };
                }
            }
        } catch (e) {
            console.log('GupshupChannelConsumer.getGupshupAccountInfos', e, { token, conversationId });
            Sentry.captureEvent({
                message: 'GupshupChannelConsumer.getGupshupAccountInfos',
                extra: {
                    error: e,
                    token,
                    conversationId,
                },
            });
        }

        // Fallback para o método antigo caso não consiga obter do channelConfig
        const privateConversationData = await this.privateDataService.findOne({ conversationId });
        return privateConversationData.privateData;
    }

    /**
     * Envia mensagem de cobrança usando a nova API v3 do Gupshup
     * @param conversation - Conversação atual
     * @param activity - Activity com os dados da mensagem
     */
    private async sendBillingMessageToGupshup(conversation: Conversation, activity: Activity) {
        try {
            const gupshupData = await this.getGupshupAccountInfos(
                castObjectIdToString(conversation._id),
                conversation.token,
            );

            const destination = activity.to.id;

            // Obtém o appId e token da Partner API usando o gupshupAppName
            const { appId, token } = await this.partnerApiService.getPartnerAppToken(gupshupData.gupshupAppName);
            const attachment = activity.attachments[0] as IResponseElementBillingCard;
            // const totalValue = attachment.items.reduce((item) => item.amount.value + total)
            // Monta o payload no formato da nova API v3 com valores default
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: Number(destination),
                type: 'interactive',
                interactive: {
                    type: 'order_details',
                    body: {
                        text: attachment.text,
                    },
                    action: {
                        name: 'review_and_pay',
                        parameters: {
                            payment_settings: attachment.buttons,
                            ...attachment.metadata,
                        },
                    },
                },
            };

            // Monta a URL com o appId obtido da Partner API
            const url = `https://partner.gupshup.io/partner/app/${appId}/v3/message`;

            const instance = this.gupshupUtilService.getAxiosInstance();
            const response = await instance.post(url, payload, {
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                },
            });

            this.handleAxiosError(response, 'sendBillingMessage');

            // O response da nova API pode ter um formato diferente, ajuste conforme necessário
            return {
                messageId: response?.data?.messages?.[0]?.id || response?.data?.id || response?.data?.message_id,
            };
        } catch (error) {
            console.log('ERROR GupshupChannelConsumer.sendBillingMessageToGupshup: ', error);
            Sentry.captureEvent({
                message: 'GupshupChannelConsumer.sendBillingMessageToGupshup',
                extra: {
                    error,
                    activity,
                    conversation,
                },
            });
            throw error;
        }
    }
}
