import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import * as moment from 'moment';
import {
    IConversationWhatsappExpirationUpdated,
    ActivityType,
    MetaWhatsappWebhookEvent,
    convertPhoneNumber,
    ChannelIdConfig,
    getWithAndWithout9PhoneNumber,
    KissbotEventDataType,
    IActivityAck,
    KissbotEventSource,
    KissbotEventType,
    AckType,
    MetaWhatsappIncomingTemplateEvent,
} from 'kissbot-core';
import { ActivityDto } from './../../../../../conversation/dto/activities.dto';
import { Conversation } from './../../../../../conversation/interfaces/conversation.interface';
import { EventsService } from './../../../../../events/events.service';
import { castObjectIdToString } from '../../../../../../common/utils/utils';
import { ExternalDataService } from './external-data.service';
import { CacheService } from '../../../../../_core/cache/cache.service';
import { Dialog360UtilService } from './dialog360-util.service';
import { v4 } from 'uuid';
import { UploadingFile } from '../../../../../../common/interfaces/uploading-file.interface';
import { ackProcessLatencyLocation } from '../../../../../../common/utils/prom-metrics';
import { KafkaService } from '../../../../../_core/kafka/kafka.service';

@Injectable()
export class Dialog360IncomingService {
    private readonly logger = new Logger(Dialog360IncomingService.name);

    constructor(
        private readonly cacheService: CacheService,
        private readonly externalDataService: ExternalDataService,
        private readonly dialog360UtilService: Dialog360UtilService,
        public readonly eventsService: EventsService,
        private kafkaService: KafkaService,
    ) {}

    async handleIncomingAck(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        try {
            const message = payload?.entry?.[0]?.changes?.[0]?.value?.['statuses']?.[0];
            const error =
                payload?.entry?.[0]?.changes?.[0]?.value?.['statuses']?.[0]?.['errors']?.[0] ||
                payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.['errors']?.[0] ||
                null;

            if (message) {
                const id =
                    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.context?.id ||
                    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id ||
                    payload?.entry?.[0]?.changes?.[0]?.value?.['statuses']?.[0]?.id ||
                    '';

                switch (message.status) {
                    case 'sent': {
                        this.externalDataService.checkMissingReceived(message.recipient_id, channelConfigToken);
                        await this.updateActivityAck(id, AckType.ServerAck, channelConfigToken, workspaceId);
                        // Handle billing event if pricing data is present
                        if (message.pricing) {
                            await this.handleBillingEvent(payload, channelConfigToken, workspaceId);
                        }
                        break;
                    }
                    case 'delivered': {
                        await this.updateActivityAck(id, AckType.DeliveryAck, channelConfigToken, workspaceId);
                        break;
                    }
                    case 'read': {
                        this.externalDataService.checkMissingRead(message.recipient_id, channelConfigToken);
                        await this.updateActivityAck(id, AckType.Read, channelConfigToken, workspaceId);
                        break;
                    }
                    case 'failed': {
                        await this.processError({
                            wppId: id,
                            errorCode: error ? error.code : null,
                            message: error ? JSON.stringify(error) : null,
                            phoneNumber: message.recipient_id,
                        });
                        break;
                    }
                    case 'enqueued': {
                        break;
                    }
                    default: {
                        // console.log('GUPSHUP Message-event nao tratada', JSON.stringify(message))
                    }
                }
            }
        } catch (e) {
            console.log(e);

            Sentry.captureException(e);

            throw e;
        }
    }

    async handleIncomingMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        let result = null;
        try {
            try {
                const existActivity = await this.externalDataService.existsActivityByHash(
                    payload.entry[0].changes[0].value.messages[0].id,
                );
                if (existActivity) {
                    this.logger.warn('duplicate activity', JSON.stringify(payload));
                    return;
                }
            } catch (e) {
                console.log('quebrou handleWhatsappMessage', e);
            }

            switch (payload.entry[0].changes[0].value.messages[0].type) {
                case 'interactive': {
                    result = await this.processInteractiveMessage(payload, channelConfigToken);
                    break;
                }
                case 'button': {
                    result = await this.processInteractiveMessage(payload, channelConfigToken);
                    break;
                }
                case 'text': {
                    result = await this.processTextMessage(payload, channelConfigToken);
                    break;
                }
                case 'image': {
                    result = await this.processMediaMessage(payload, channelConfigToken);
                    break;
                }
                case 'audio': {
                    result = await this.processMediaMessage(payload, channelConfigToken);
                    break;
                }
                case 'video': {
                    result = await this.processMediaMessage(payload, channelConfigToken);
                    break;
                }
                case 'document': {
                    result = await this.processMediaMessage(payload, channelConfigToken);
                    break;
                }
                case 'contacts': {
                    result = await this.processContactsMessage(payload, channelConfigToken);
                    break;
                }
                case 'reaction': {
                    result = await this.processReactionMessage(payload, channelConfigToken);
                    break;
                }
                default: {
                    console.log('Dialog360 incoming message nao tratada', JSON.stringify(payload));
                }
            }

            return result;
        } catch (e) {
            console.log(e);

            Sentry.captureException(e);

            throw e;
        }
    }

    async handleIncomingTemplateStatusChanged(payload: MetaWhatsappIncomingTemplateEvent, channelConfigToken: string) {
        const message = payload?.data?.template;

        try {
            if (!message?.new_status) {
                Sentry.captureEvent({
                    message: 'Template event no status: handleIncomingTemplateStatusChanged',
                    extra: {
                        channelConfigToken,
                        message: JSON.stringify(message),
                    },
                });
            }
            // await this.sendWebHookUpdateStatusTemplate(message, channelConfigToken);
            await this.externalDataService.updateTemplateApprovalStatusAndWhatsappId(
                channelConfigToken,
                message.id,
                message.external_id,
                message.new_status,
                message.rejected_reason,
            );
        } catch (e) {
            this.logger.error('handleIncomingTemplateEvent');
            this.logger.error(e);
        }
    }

    async handleIncomingTemplateCategoryChanged(
        payload: MetaWhatsappIncomingTemplateEvent,
        channelConfigToken: string,
    ) {
        const message = payload?.data?.template;

        try {
            if (!message?.new_category) {
                Sentry.captureEvent({
                    message: 'Template event no category: handleIncomingTemplateCategoryChanged',
                    extra: {
                        channelConfigToken,
                        message: JSON.stringify(message),
                    },
                });
            }
            // await this.sendWebHookUpdateStatusTemplate(message, channelConfigToken);
            await this.externalDataService.updateTemplateCategory(
                channelConfigToken,
                message.name,
                message.new_category,
            );
        } catch (e) {
            this.logger.error('handleIncomingTemplateEvent');
            this.logger.error(e);
        }
    }

    //     private async sendWebHookUpdateStatusTemplate(message: GupshupMessage, channelConfigToken: string) {
    //         try {
    //             let content = '';

    //             if ((message?.payload?.type as any) !== 'category-update') {
    //                 return;
    //             }

    //             if (
    //                 typeof message?.payload?.category == 'object' &&
    //                 ((message?.payload?.category?.old === 'UTILITY' && message?.payload?.category?.new === 'MARKETING') ||
    //                     ((message?.payload?.category as any)?.correct === 'MARKETING' &&
    //                         (message?.payload?.category as any)?.current === 'UTILITY'))
    //             ) {
    //                 const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

    //                 if (channelConfig) {
    //                     content = `**Mudança de categoria do template**\n\n
    // Workspace: ${channelConfig.workspace.name}\n
    // workspaceId: ${channelConfig.workspaceId}\n
    // Link do template: ${`https://app.botdesigner.io/settings/templates/${message.payload?.elementName}`}\n
    // appName: ${message?.app || channelConfig?.configData?.appName}\n
    // Nome do canal: ${channelConfig.name}\n
    // channelConfigToken: ${channelConfigToken}\n
    // channelConfigId: ${channelConfig._id}`;
    //                 }
    //             }

    //             if (!content) {
    //                 return;
    //             }

    //             if (process.env.NODE_ENV !== 'local') {
    //                 const cbUrl =
    //                     'https://chat.googleapis.com/v1/spaces/AAAAdxGSXVU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=hT6TW8b3cbitjazDzoHHl16WqwOaiCTh2yFLMTFl6qc';

    //                 axios
    //                     .post(cbUrl, {
    //                         text: content,
    //                     })
    //                     .then();
    //             }
    //         } catch (error) {
    //             Sentry.captureEvent({
    //                 message: 'Template event change status: sendWebHookUpdateStatusTemplate',
    //                 extra: {
    //                     channelConfigToken,
    //                     message: JSON.stringify(message),
    //                 },
    //             });
    //             console.log(error);
    //         }
    //     }

    private async processInteractiveMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.dialog360UtilService.getMemberId(payload);
        const memberName = this.dialog360UtilService.getMemberName(payload);

        // let responseFlow = {};
        // let flow: Flow;
        // try {
        //     responseFlow = JSON.parse(
        //         payload.entry[0].changes[0].value.messages[0].interactive?.nfm_reply?.response_json,
        //     );
        // } catch (e) {
        //     console.log('Error processInteractiveMessage parse JSON: ', JSON.stringify(e));
        //     return null;
        // }

        // if (responseFlow?.['flow_token'] !== 'unused') {
        //     flow = await this.externalDataService.getFlowById(responseFlow['flow_token']);
        // }

        // if (!flow) {
        //     console.log('Error not found Flow: ', JSON.stringify(payload));
        //     return null;
        // }

        this.externalDataService.checkMissingResponse(memberId, channelConfigToken);
        const hash = this.dialog360UtilService.getHash(payload);
        await this.dialog360UtilService.setDialog360IdHash(hash, hash);
        await this.awaiterDelay(memberId, channelConfigToken);
        const quoted = await this.getQuoted(payload);

        let startActivity: ActivityDto;
        let conversation;
        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processTextMessage');
            console.error(e);
            Sentry.captureException(e);
        }

        if (!conversation) {
            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR dialog360Service.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: this.dialog360UtilService.getText(payload),
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                // channelId: ChannelIdConfig.d360,
                // memberChannel: ChannelIdConfig.d360,
                channelId: ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: memberName,
                memberPhone: convertPhoneNumber(memberId),
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    dialog360AppName: channelConfig.configData.appName,
                },
                channelConfig,
                referralSourceId: null,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        if (startActivity) {
            return await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
        } else {
            const activity = await this.dialog360UtilService.getActivityDto(payload, conversation);
            activity.quoted = quoted;

            const replyTitle =
                payload.entry[0].changes[0].value.messages[0]?.interactive?.['button_reply']?.title ||
                payload.entry[0].changes[0].value.messages[0]?.interactive?.['list_reply']?.title;
            if (replyTitle) {
                activity.data = {
                    ...(activity?.data || {}),
                    replyTitle,
                };
                const text =
                    payload.entry[0].changes[0].value.messages[0]?.interactive?.['button_reply']?.id ||
                    payload.entry[0].changes[0].value.messages[0]?.interactive?.['list_reply']?.id;
                if (text) {
                    activity.text = text;
                }
            }

            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async processTextMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.dialog360UtilService.getMemberId(payload);
        const memberName = this.dialog360UtilService.getMemberName(payload);

        this.externalDataService.checkMissingResponse(memberId, channelConfigToken);
        const hash = this.dialog360UtilService.getHash(payload);
        // await this.dialog360UtilService.setDialog360IdHash(hash, hash);
        await this.awaiterDelay(memberId, channelConfigToken);
        const quoted = await this.getQuoted(payload);

        let startActivity: ActivityDto;
        let conversation;
        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processTextMessage');
            console.error(e);
            Sentry.captureException(e);
        }

        if (!conversation) {
            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR dialog360Service.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: this.dialog360UtilService.getText(payload),
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                // channelId: ChannelIdConfig.d360,
                // memberChannel: ChannelIdConfig.d360,
                channelId: ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: memberName,
                memberPhone: convertPhoneNumber(memberId),
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    dialog360AppName: channelConfig.configData.appName,
                },
                channelConfig,
                referralSourceId: null,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        if (startActivity) {
            return await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
        } else {
            const activity = await this.dialog360UtilService.getActivityDto(payload, conversation);
            activity.quoted = quoted;

            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async processContactsMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.dialog360UtilService.getMemberId(payload);
        const memberName = this.dialog360UtilService.getMemberName(payload);

        this.externalDataService.checkMissingResponse(memberId, channelConfigToken);

        const hash = this.dialog360UtilService.getHash(payload);
        await this.dialog360UtilService.setDialog360IdHash(hash, hash);
        await this.awaiterDelay(memberId, channelConfigToken);

        const contacts = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.['contacts'] || [];
        const attachments = contacts
            .map((contact) => this.dialog360UtilService.convertContactToAttachment(contact))
            .filter((attachment) => !!attachment);

        const quoted = await this.getQuoted(payload);

        let startActivity: ActivityDto;
        let conversation;
        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processContactsMessage');
            console.error(e);
            Sentry.captureException(e);
        }

        if (!conversation) {
            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log('ERROR dialog360Service.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: this.dialog360UtilService.getText(payload),
                activityTimestamp: moment().valueOf(),
                activityQuoted: quoted,
                channelConfigToken,
                channelId: ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: memberName,
                memberPhone: convertPhoneNumber(memberId),
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    dialog360AppName: channelConfig.configData.appName,
                },
                channelConfig,
                referralSourceId: null,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        if (startActivity) {
            startActivity.attachments = attachments;
            return await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
        } else {
            const activity = await this.dialog360UtilService.getActivityDto(payload, conversation);
            activity.attachments = attachments;
            activity.quoted = quoted;
            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async processMediaMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.dialog360UtilService.getMemberId(payload);
        const memberName = this.dialog360UtilService.getMemberName(payload);
        const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);
        const channelData = await this.dialog360UtilService.getChannelData(channelConfig);

        try {
            this.externalDataService.checkMissingResponse(
                payload.entry[0].changes[0].value.messages[0].from,
                channelConfigToken,
            );
            await this.dialog360UtilService.setDialog360IdHash(
                payload.entry[0].changes[0].value.messages[0].id,
                payload.entry[0].changes[0].value.messages[0].id,
            );
            await this.awaiterDelay(payload.entry[0].changes[0].value.messages[0].from, channelConfigToken);

            const mediaId =
                payload.entry[0].changes[0].value.messages[0]?.['image']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['video']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['audio']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['document']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['sticker']?.id;

            if (!mediaId) {
                return;
            }

            // GET MEDIA FROM DIALOG360
            const instance = this.dialog360UtilService.getAxiosInstance();
            const mediaInfo = await instance.get(encodeURI(mediaId), {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'application/json',
                    'D360-API-KEY': channelData.d360ApiKey,
                },
            });
            if (mediaInfo.status > 300) {
                const bufferError = Buffer.from(mediaInfo.data, 'binary');
                Sentry.captureEvent({
                    message: 'Dialog360Service.processMediaMessage response.status > 300',
                    extra: {
                        err: bufferError.toString(),
                    },
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Error d360', bufferError.toString());
                }
                return;
            }

            const mediaDataBinaryToString = JSON.parse(mediaInfo.data.toString('binary'));

            const mediaUrl = mediaDataBinaryToString?.url;
            const mediaPath = mediaUrl?.replace('https://lookaside.fbsbx.com', '');

            const response = await instance.get(mediaPath, {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'application/json',
                    'D360-API-KEY': channelData.d360ApiKey,
                },
            });

            if (response.status > 300) {
                const bufferError = Buffer.from(response.data, 'binary');
                Sentry.captureEvent({
                    message: 'Dialog360Service.processMediaMessage response.status > 300',
                    extra: {
                        err: bufferError.toString(),
                    },
                });
                return;
            }

            const getFileNameFromHeader = (name: string): string => {
                try {
                    return name
                        .split('=')[1]
                        .trim()
                        .replace(/^\"+|\"+$/g, '');
                } catch (e) {
                    return v4();
                }
            };
            const fileName = getFileNameFromHeader(response.headers['content-disposition'] as string);
            const fileExtension = response.headers['content-type'].split('/')[1];

            if (!fileExtension) {
                Sentry.captureEvent({
                    message: 'gupshup: invalid fileExtension',
                    extra: {
                        contentDisposition: response.headers['content-disposition'],
                        fileName,
                        fileExtension,
                    },
                });
            }

            const buffer = Buffer.from(response.data, 'binary');
            const fileToUpload: UploadingFile = {
                buffer,
                encoding: '',
                mimetype: response.headers['content-type'],
                size: buffer.byteLength,
                originalname: fileName,
                extension: fileExtension,
            };
            const quoted = await this.getQuoted(payload);
            const referralSourceId = payload?.entry[0].changes[0].value.messages[0]?.id;

            let startActivity: ActivityDto;
            let messageText: string = this.dialog360UtilService.getText(payload);

            let conversation;

            try {
                conversation = await this.getExistingConversation(channelConfigToken, memberId);
            } catch (e) {
                this.logger.error('processMediaMessage');
                console.error(e);
                Sentry.captureException(e);
            }

            if (!conversation) {
                conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
            }

            if (!conversation) {
                const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

                try {
                    // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                    if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                        return;
                    }
                } catch (error) {
                    console.log(
                        'ERROR Dialog360IncomingService.processMediaMessage validate block inbound message: ',
                        error,
                    );
                }

                const r = await this.externalDataService.getConversation({
                    activityHash: payload.entry[0].changes[0].value.messages[0].id,
                    activityText: messageText,
                    activityTimestamp: moment().valueOf(),
                    activityQuoted: quoted,
                    channelConfigToken,
                    channelId: !!referralSourceId ? ChannelIdConfig.ads : ChannelIdConfig.gupshup,
                    memberChannel: ChannelIdConfig.gupshup,
                    memberId,
                    memberName: memberName,
                    memberPhone: convertPhoneNumber(memberId),
                    privateConversationData: {
                        phoneNumber: channelConfig?.configData?.phoneNumber,
                        apikey: channelConfig?.configData?.apikey,
                        dialog360AppName: channelConfig.configData.appName,
                    },
                    channelConfig,
                    referralSourceId: referralSourceId,
                });

                conversation = r.conversation;
                startActivity = r.startActivity;
            }

            if (!conversation) {
                return;
            }

            //! TODO: Referral
            // await this.createReferral(payload, conversation);

            if (startActivity) {
                const attachment = await this.externalDataService.createAndUpload(
                    fileToUpload,
                    conversation._id,
                    getWithAndWithout9PhoneNumber(memberId),
                    true,
                );
                startActivity.referralSourceId = referralSourceId;
                startActivity.attachmentFile = {
                    contentType: attachment.mimeType,
                    contentUrl: attachment.attachmentLocation,
                    name: attachment.name,
                    key: attachment.key,
                    id: attachment.id || attachment._id,
                };
                startActivity.hash = payload.entry[0].changes[0].value.messages[0].id;
                await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
            } else {
                await this.updateConversationWhatsappExpiration(
                    conversation._id,
                    payload.entry[0].changes[0].value.messages[0].from,
                    channelConfigToken,
                );
                await this.externalDataService.createAndUpload(
                    fileToUpload,
                    conversation._id,
                    getWithAndWithout9PhoneNumber(memberId),
                    false,
                    messageText,
                    null,
                    null,
                    payload.entry[0].changes[0].value.messages[0].id || null,
                );
            }
        } catch (e) {
            console.log('Dialog360Service.processMediaMessage', e);
            try {
                let messageErr = e;
                if (e?.response?.data?.toString && typeof e?.response?.data?.toString == 'function') {
                    messageErr = e?.response?.data?.toString();
                }
                if (e?.toString && typeof e?.toString == 'function') {
                    messageErr = e?.toString?.();
                }
                Sentry.captureEvent({
                    message: 'GupshupService.processMediaMessage',
                    extra: {
                        error: messageErr,
                    },
                });
            } catch (e) {
                Sentry.captureEvent({
                    message: 'GupshupService.processMediaMessage catch 2',
                    extra: {
                        error: e,
                    },
                });
            }
        }
        // Quando for uma startActivity deve ser enviada depois do createAttachment pois senão o attachmente cai no fallback no engine
    }

    private async getQuoted(payload: MetaWhatsappWebhookEvent) {
        let quoted;
        const wppId =
            payload?.entry[0].changes[0].value.messages[0].reaction?.message_id ||
            payload?.entry[0].changes[0].value.messages[0].context?.id;

        if (wppId) {
            const client = await this.cacheService.getClient();
            const key = this.dialog360UtilService.getActivtyDialog360IdHashCacheKey(wppId);
            const hash = await client.get(key);
            quoted = hash;
            if (!hash) {
                quoted = await this.externalDataService.findHashByWppId(wppId);
            }
        }
        if (!quoted && wppId) {
            quoted = wppId;
        }

        return quoted;
    }

    private async awaiterDelay(phoneNumber: string, channelConfigToken: string) {
        const secondsToWait = await this.cacheService.incr(`${phoneNumber}:${channelConfigToken}`, 10);
        await new Promise((r) => setTimeout(r, (secondsToWait - 1) * 500));
    }

    private async getExistingConversation(channelConfigToken: string, memberId: string) {
        let conversation;
        if (memberId.startsWith('55')) {
            const [option1, option2] = await this.dialog360UtilService.getAllPossibleBrIds(memberId);

            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, option1);

            if (!conversation) {
                conversation = await this.externalDataService.getExistingConversation(channelConfigToken, option2);
            }

            if (!conversation) {
                conversation = await this.externalDataService.getConversationByMemberIdListAndChannelConfig(
                    [option1, option2],
                    channelConfigToken,
                );
            }
        } else {
            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
        }

        return conversation;
    }

    private async handleActivity(
        activityRequest: ActivityDto,
        payload: MetaWhatsappWebhookEvent,
        channelConfigToken: string,
        conversation?: Conversation,
    ) {
        const whatsappExpiration = await this.updateConversationWhatsappExpiration(
            conversation._id,
            payload.entry[0].changes[0].value.messages[0].from,
            channelConfigToken,
        );
        if (whatsappExpiration > conversation.whatsappExpiration) {
            conversation.whatsappExpiration = whatsappExpiration;
        }

        try {
            if (
                !activityRequest?.text &&
                !activityRequest?.attachmentFile &&
                activityRequest.type == ActivityType.message
            ) {
                Sentry.captureEvent({
                    message: 'DEBUG Dialog360IncomingService: empty message',
                    extra: {
                        activityRequest: JSON.stringify(activityRequest),
                        payload: JSON.stringify(payload),
                    },
                });
            }
        } catch (e) {
            Sentry.captureEvent({
                message: 'DEBUG Dialog360IncomingService: empty message catch',
                extra: {
                    e,
                },
            });
        }

        return await this.externalDataService.handleActivity(
            activityRequest,
            castObjectIdToString(conversation._id),
            conversation,
            true,
        );
    }

    async updateConversationWhatsappExpiration(
        conversationId,
        phoneNumber: string,
        channelConfigToken: string,
    ): Promise<number> {
        const timestamp = moment().add(24, 'hours').valueOf();
        await this.externalDataService.updateWhatsappExpiration({
            conversationId,
            timestamp,
            phoneNumber: phoneNumber,
        } as IConversationWhatsappExpirationUpdated);
        await this.externalDataService.updateConversationSessionCount(phoneNumber, conversationId, channelConfigToken);
        return timestamp;
    }

    private async processReactionMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        this.externalDataService.checkMissingResponse(
            payload.entry[0].changes[0].value.messages[0].from,
            channelConfigToken,
        );
        await this.dialog360UtilService.setDialog360IdHash(
            payload.entry[0].changes[0].value.messages[0].id,
            payload.entry[0].changes[0].value.messages[0].id,
        );
        await this.awaiterDelay(payload.entry[0].changes[0].value.messages[0].from, channelConfigToken);
        const quoted = await this.getQuoted(payload);
        const memberId = this.dialog360UtilService.getMemberId(payload);
        const memberName = this.dialog360UtilService.getMemberName(payload);
        const hash = this.dialog360UtilService.getHash(payload);

        let startActivity: ActivityDto;
        let conversation;
        try {
            conversation = await this.getExistingConversation(channelConfigToken, memberId);
        } catch (e) {
            this.logger.error('processReactionMessage');
            console.error(e);
            Sentry.captureException(e);
        }

        if (!conversation) {
            conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
        }

        if (!conversation) {
            const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

            try {
                // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
                if (channelConfig && !!channelConfig?.blockInboundAttendance) {
                    return;
                }
            } catch (error) {
                console.log(
                    'ERROR Dialog360IncomingService.processReactionMessage validate block inbound message: ',
                    error,
                );
            }

            const messageText = await this.dialog360UtilService.getText(payload);

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: messageText,
                activityTimestamp: moment().valueOf(),
                activityQuoted: null,
                channelConfigToken,
                channelId: ChannelIdConfig.gupshup,
                memberChannel: ChannelIdConfig.gupshup,
                memberId,
                memberName: memberName,
                memberPhone: convertPhoneNumber(memberId),
                privateConversationData: {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    dialog360AppName: channelConfig.configData.appName,
                },
                channelConfig,
            });

            conversation = r.conversation;
            startActivity = r.startActivity;
        }

        if (!conversation) {
            return;
        }

        if (startActivity) {
            return await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
        } else {
            const activity = await this.dialog360UtilService.getActivityDto(payload, conversation);
            activity.data = { ...(activity.data || {}), reactionHash: quoted, quoted };
            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async processError({
        wppId,
        errorCode,
        message,
        phoneNumber,
        channelConfigToken,
        workspaceId,
    }: {
        wppId: string;
        errorCode: number;
        message?: string;
        phoneNumber?: string;
        channelConfigToken?: string;
        workspaceId?: string;
    }) {
        class GupshupError extends Error {
            constructor(message: any) {
                super(message);
                this.name = `GupshupError:${message}`;
            }
        }
        let ackType: AckType;
        let ackTypeNotDefined: boolean = false;
        let ackInvalidNumber: boolean = false;
        switch (errorCode) {
            case 500: {
                ackType = AckType.Error500;
                Sentry.captureException(new GupshupError(message));
                break;
            }
            case 503: {
                // Error Failed connection - permitir reenvio da mensagem
                ackType = AckType.Error500;
                break;
            }
            case 1002: {
                ackType = AckType.NumberDontExists;
                ackInvalidNumber = true;
                break;
            }
            case 472:
            case 130472: {
                ackType = AckType.UserExperiment;
                break;
            }
            case 1013: {
                ackType = AckType.UserDontExists;
                ackInvalidNumber = true;
                break;
            }
            case 4003: {
                ackType = AckType.NoTemplateMatch;
                break;
            }
            case 1001: {
                ackType = AckType.MessageTooLong;
                break;
            }
            case 131026: {
                ackType = AckType.MessageUndeliverable;
                ackInvalidNumber = true;
                break;
            }
            case 131049: {
                ackType = AckType.LimitTemplateMarketingExceeded;
                break;
            }
            case 133010: {
                ackType = AckType.PhoneNotRegisteredOnWhatsappBusiness;
                break;
            }
            default: {
                ackType = -errorCode;
                ackTypeNotDefined = true;
            }
        }

        if (ackType) {
            this.externalDataService.checkMissingReceived(phoneNumber, channelConfigToken, String(ackType));
            const hash = await this.updateActivityAck(wppId, ackType, channelConfigToken, workspaceId);
            if (
                (ackType == AckType.NumberDontExists ||
                    ackType == AckType.UserDontExists ||
                    ackType == AckType.MessageUndeliverable) &&
                !!ackInvalidNumber
            ) {
                this.handleNumberDontExistsCallback(hash);
            }
            return;
        }
        if (!!ackTypeNotDefined) {
            Sentry.captureEvent({
                message: 'Not finded gupshup acktype',
                extra: {
                    message,
                    wppId,
                    errorCode,
                    phoneNumber,
                },
            });
        }
    }

    async handleNumberDontExistsCallback(hash: string) {
        const wppHashId = await this.externalDataService.findByHash(hash);
        if (wppHashId) {
            await this.externalDataService.updateConversationInvalidNumber(
                wppHashId.conversationId,
                wppHashId.workspaceId,
            );
        }
    }

    async updateActivityAck(wppMessageId: string, ack: number, channelConfigToken: string, workspaceId?: string) {
        const timer = ackProcessLatencyLocation.labels('loc1').startTimer();
        const client = await this.cacheService.getClient();
        const key = this.dialog360UtilService.getActivtyDialog360IdHashCacheKey(wppMessageId);
        let hash = await client.get(key);
        timer();

        const timer2 = ackProcessLatencyLocation.labels('loc2').startTimer();
        if (!hash) {
            await new Promise((r) => setTimeout(r, 1000));
            hash = await client.get(key);
            if (!hash) {
                hash = await this.externalDataService.findHashByWppId(wppMessageId);
                if (!hash) {
                    return;
                }
            }
        }
        timer2();

        const timer3 = ackProcessLatencyLocation.labels('loc3').startTimer();
        if (ack === AckType.Read) {
            await client.expire(key, 100);
        }
        timer3();
        //Todo publish to kafka

        const timer4 = ackProcessLatencyLocation.labels('loc4').startTimer();
        let conversation;
        if (ack === AckType.ServerAck) {
            const conversationId = await this.externalDataService.getConversationIdByActivityHash(hash);
            if (conversationId) {
                conversation = await this.externalDataService.getOneConversation(conversationId);
                if (!!conversation && !conversation?.deliveredMessage) {
                    await this.externalDataService.updateDeliveredMessageInConversation(conversationId);
                }
            }
        }
        timer4();

        const timer5 = ackProcessLatencyLocation.labels('loc5').startTimer();
        const data = {
            data: {
                ack,
                hash: [hash],
                timestamp: moment().format().valueOf(),
                workspaceId,
                conversation: conversation,
            } as IActivityAck & { conversation: any },
            dataType: KissbotEventDataType.WHATSWEB_MESSAGE_ACK,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WHATSWEB_MESSAGE_ACK,
        };

        this.kafkaService.sendEvent(data, channelConfigToken, 'activity_ack');
        timer5();
        return hash;
    }

    private async handleBillingEvent(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        try {
            const message = payload?.entry?.[0]?.changes?.[0]?.value?.['statuses']?.[0];
            if (!message?.pricing) {
                return;
            }

            const messageId = message.id;
            const recipientId = message.recipient_id;
            const pricing = message.pricing;
            if (!pricing.billable) return;
            const conversation = message.conversation;
            const timestamp = message.timestamp ? parseInt(message.timestamp) * 1000 : moment().valueOf();

            // Try to resolve conversationId from message hash
            let conversationId: string | undefined;
            let hash;
            try {
                hash = await this.externalDataService.findHashByWppId(messageId);
                if (hash) {
                    conversationId = await this.externalDataService.getConversationIdByActivityHash(hash);
                }
            } catch (e) {
                this.logger.warn('Could not resolve conversationId for billing event', e);
            }

            await this.externalDataService.createWhatsappBillingEvent({
                conversationId,
                workspaceId,
                channelConfigToken,
                messageId: hash,
                recipientId,
                conversationWhatsappId: conversation?.id,
                conversationExpirationTimestamp: conversation?.expiration_timestamp,
                conversationOriginType: conversation?.origin?.type,
                billable: pricing.billable,
                pricingModel: pricing.pricing_model,
                category: pricing.category,
                pricingType: pricing.type,
                timestamp,
            });
        } catch (e) {
            this.logger.error('Error handling billing event', e);
        }
    }
}
