import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import * as moment from 'moment';
import {
    IConversationWhatsappExpirationUpdated,
    ActivityType,
    convertPhoneNumber,
    ChannelIdConfig,
    MetaWhatsappWebhookEvent,
    getWithAndWithout9PhoneNumber,
    AckType,
    IActivityAck,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
    MetaWhatsappIncomingTemplateEvent,
} from 'kissbot-core';
import { ActivityDto, Attachment } from './../../../../../conversation/dto/activities.dto';
import { Conversation } from './../../../../../conversation/interfaces/conversation.interface';
import { EventsService } from './../../../../../events/events.service';
import { castObjectIdToString } from '../../../../../../common/utils/utils';
import { ExternalDataService } from './external-data.service';
import { CacheService } from '../../../../../_core/cache/cache.service';
import { GupshupV3UtilService } from './gupshup-util.service';
import { Flow } from '../../../../../whatsapp-flow/models/flow.entity';
import { v4 } from 'uuid';
import { ackProcessLatencyLocation } from '../../../../../../common/utils/prom-metrics';
import { KafkaService } from '../../../../../_core/kafka/kafka.service';

@Injectable()
export class GupshupV3IncomingService {
    private readonly logger = new Logger(GupshupV3IncomingService.name);

    constructor(
        private readonly cacheService: CacheService,
        private readonly externalDataService: ExternalDataService,
        private readonly gupshupV3UtilService: GupshupV3UtilService,
        public readonly eventsService: EventsService,
        private kafkaService: KafkaService,
    ) {}

    async handleIncomingMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        let result = null;
        try {
            try {
                const existActivity = await this.externalDataService.existsActivityByHash(
                    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id,
                );
                if (existActivity) {
                    this.logger.warn('duplicate activity', JSON.stringify(payload));
                    return;
                }
            } catch (e) {
                console.log('quebrou handleWhatsappMessage', e);
            }

            switch (payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.type) {
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
                    console.log('GupshupV3 incoming message nao tratada', JSON.stringify(payload));
                }
            }

            return result;
        } catch (e) {
            console.log(e);

            Sentry.captureException(e);

            throw e;
        }
    }

    async handleIncomingAck(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        const status = payload?.entry?.[0]?.changes?.[0]?.value?.['statuses']?.[0];

        if (!status) {
            this.logger.warn('No statuses found in Meta webhook payload', {
                channelConfigToken,
                payload: JSON.stringify(payload),
            });
            return;
        }

        const id = status.gs_id || '';
        const statusType = status.status;
        const destination = status.recipient_id;
        const error = status.errors?.[0]
            ? {
                  code: status.errors[0].code,
                  reason: status.errors[0].title,
              }
            : null;

        switch (statusType) {
            case 'sent': {
                this.externalDataService.checkMissingReceived(destination, channelConfigToken);
                await this.updateActivityAck(id, AckType.ServerAck, channelConfigToken, workspaceId);
                break;
            }
            case 'delivered': {
                await this.updateActivityAck(id, AckType.DeliveryAck, channelConfigToken, workspaceId);
                break;
            }
            case 'read': {
                this.externalDataService.checkMissingRead(destination, channelConfigToken);
                await this.updateActivityAck(id, AckType.Read, channelConfigToken, workspaceId);
                break;
            }
            case 'failed': {
                await this.processError({
                    wppId: id,
                    errorCode: error ? error.code : null,
                    message: error ? JSON.stringify(error) : null,
                    phoneNumber: destination,
                    channelConfigToken,
                    workspaceId,
                });
                break;
            }
            case 'enqueued': {
                // Message is queued, no action needed
                break;
            }
            default: {
                this.logger.warn('Meta webhook status type not handled', {
                    statusType,
                    channelConfigToken,
                    payload: JSON.stringify(payload),
                });
            }
        }
    }

    async handleIncomingTemplateStatusChanged(payload: MetaWhatsappIncomingTemplateEvent, channelConfigToken: string) {
        try {
            const templateData = payload?.['entry']?.[0]?.changes?.[0]?.value;

            if (!templateData) {
                this.logger.warn('Template event no template data: handleIncomingTemplateStatusChanged', {
                    channelConfigToken,
                    payload: JSON.stringify(payload),
                });
                return;
            }

            const templateId = templateData.message_template_name;
            const externalId = templateData.gs_template_id;
            const newStatus = templateData.event;
            const rejectedReason = templateData.reason;

            if (!templateId || !newStatus) {
                Sentry.captureEvent({
                    message: 'Template event missing required fields: handleIncomingTemplateStatusChanged',
                    extra: {
                        channelConfigToken,
                        templateData: JSON.stringify(templateData),
                    },
                });
                return;
            }

            if (!this.externalDataService) {
                this.logger.error('ExternalDataService not available for template status update');
                return;
            }

            console.log('Calling updateTemplateApprovalStatusAndWhatsappId with:', {
                channelConfigToken,
                templateId,
                externalId,
                newStatus,
                rejectedReason,
            });

            await this.externalDataService.updateTemplateApprovalStatusAndWhatsappId(
                channelConfigToken,
                templateId,
                externalId,
                newStatus,
                rejectedReason,
            );

            console.log('Template status update completed successfully');
        } catch (e) {
            this.logger.error('handleIncomingTemplateStatusChanged error', e);
            Sentry.captureException(e);
        }
    }

    async handleIncomingTemplateCategoryChanged(
        payload: MetaWhatsappIncomingTemplateEvent,
        channelConfigToken: string,
    ) {
        try {
            const templateData = payload?.['entry']?.[0]?.changes?.[0]?.value;

            if (!templateData) {
                this.logger.warn('Template event no template data: handleIncomingTemplateCategoryChanged', {
                    channelConfigToken,
                    payload: JSON.stringify(payload),
                });
                return;
            }

            const templateName = templateData.message_template_name;
            const newCategory = templateData.new_category;

            if (!templateName || !newCategory) {
                Sentry.captureEvent({
                    message: 'Template event missing required fields: handleIncomingTemplateCategoryChanged',
                    extra: {
                        channelConfigToken,
                        templateData: JSON.stringify(templateData),
                    },
                });
                return;
            }

            if (!this.externalDataService) {
                this.logger.error('ExternalDataService not available for template category update');
                return;
            }

            await this.externalDataService.updateTemplateCategory(channelConfigToken, templateName, newCategory);
        } catch (e) {
            this.logger.error('handleIncomingTemplateCategoryChanged error', e);
            Sentry.captureException(e);
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

    private async processTextMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.gupshupV3UtilService.getMemberId(payload);
        const memberName = this.gupshupV3UtilService.getMemberName(payload);

        this.externalDataService.checkMissingResponse(memberId, channelConfigToken);
        const hash = this.gupshupV3UtilService.getHash(payload);
        // await this.gupshupV3UtilService.setGupshupIdHash(hash, hash);
        await this.awaiterDalay(memberId, channelConfigToken);
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
                console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
            }

            const messageText = this.gupshupV3UtilService.getText(payload);

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: messageText,
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
                    gupshupAppName: channelConfig.configData.appName,
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
            const activity = await this.gupshupV3UtilService.getActivityDto(payload, conversation);
            activity.quoted = quoted;

            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async processContactsMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.gupshupV3UtilService.getMemberId(payload);
        const memberName = this.gupshupV3UtilService.getMemberName(payload);

        this.externalDataService.checkMissingResponse(memberId, channelConfigToken);

        const hash = this.gupshupV3UtilService.getHash(payload);
        await this.gupshupV3UtilService.setGupshupIdHash(hash, hash);
        await this.awaiterDelay(memberId, channelConfigToken);

        const contacts = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.['contacts'] || [];
        const attachments = contacts
            .map((contact) => this.gupshupV3UtilService.convertContactToAttachment(contact))
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
                console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
            }

            const messageText = this.gupshupV3UtilService.getText(payload);

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: messageText,
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
                    gupshupAppName: channelConfig.configData.appName,
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
            const activity = await this.gupshupV3UtilService.getActivityDto(payload, conversation);
            activity.attachments = attachments;
            activity.quoted = quoted;
            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async awaiterDelay(phoneNumber: string, channelConfigToken: string) {
        const secondsToWait = await this.cacheService.incr(`${phoneNumber}:${channelConfigToken}`, 10);
        await new Promise((r) => setTimeout(r, (secondsToWait - 1) * 500));
    }

    private async processMediaMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.gupshupV3UtilService.getMemberId(payload);
        const memberName = this.gupshupV3UtilService.getMemberName(payload);
        const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);
        const channelData = await this.gupshupV3UtilService.getChannelData(channelConfig);

        try {
            this.externalDataService.checkMissingResponse(
                payload.entry[0].changes[0].value.messages[0].from,
                channelConfigToken,
            );
            await this.gupshupV3UtilService.setGupshupIdHash(
                payload.entry[0].changes[0].value.messages[0].id,
                payload.entry[0].changes[0].value.messages[0].id,
            );
            await this.awaiterDelay(payload.entry[0].changes[0].value.messages[0].from, channelConfigToken);

            // Extract media information from Gupshup V3 payload structure
            const message = payload.entry[0].changes[0].value.messages[0];
            const mediaPayload =
                message?.['image'] ||
                message?.['video'] ||
                message?.['audio'] ||
                message?.['document'] ||
                message?.['sticker'];

            if (!mediaPayload) {
                this.logger.warn('No media payload found in Gupshup V3 message', JSON.stringify(payload));
                return;
            }

            // Gupshup V3 provides direct URL access
            const mediaUrl = mediaPayload.url;
            const contentType = mediaPayload.mime_type;
            const caption = mediaPayload.caption || '';
            const fileName = mediaPayload.filename || '';

            if (!mediaUrl) {
                this.logger.warn('No media URL found in Gupshup V3 payload', JSON.stringify(mediaPayload));
                return;
            }

            // Download media from Gupshup URL
            const instance = this.gupshupV3UtilService.getAxiosInstance();
            const response = await instance.get(mediaUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: channelConfigToken,
                },
            });

            if (response.status > 300) {
                const bufferError = Buffer.from(response.data, 'binary');
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processGupshupV3MediaMessage response.status > 300',
                    extra: {
                        err: bufferError.toString(),
                        mediaUrl,
                        status: response.status,
                    },
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Error downloading media from Gupshup V3', bufferError.toString());
                }
                return;
            }

            // Extract file extension from content type
            const fileExtension = contentType?.split('/')[1] || 'bin';

            // Use provided filename or generate one
            const finalFileName = fileName || `media_${Date.now()}.${fileExtension}`;

            const buffer = Buffer.from(response.data, 'binary');
            const fileToUpload = {
                buffer,
                encoding: '',
                mimetype: contentType,
                size: buffer.byteLength,
                originalname: finalFileName,
                extension: fileExtension,
            };

            const quoted = await this.getQuoted(payload);
            const referralSourceId = payload?.entry[0].changes[0].value.messages[0]?.id;

            let startActivity: ActivityDto;
            let messageText: string = caption || this.gupshupV3UtilService.getText(payload);

            let conversation;

            try {
                conversation = await this.getExistingConversation(channelConfigToken, memberId);
            } catch (e) {
                this.logger.error('processGupshupV3MediaMessage');
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
                        'ERROR GupshupV3IncomingService.processGupshupV3MediaMessage validate block inbound message: ',
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
                        gupshupAppName: channelConfig.configData.appName,
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
            console.log('GupshupV3Service.processGupshupV3MediaMessage', e);
            try {
                let messageErr = e;
                if (e?.response?.data?.toString && typeof e?.response?.data?.toString == 'function') {
                    messageErr = e?.response?.data?.toString();
                }
                if (e?.toString && typeof e?.toString == 'function') {
                    messageErr = e?.toString?.();
                }
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processGupshupV3MediaMessage',
                    extra: {
                        error: messageErr,
                        payload: JSON.stringify(payload),
                    },
                });
            } catch (e) {
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processGupshupV3MediaMessage catch 2',
                    extra: {
                        error: e,
                    },
                });
            }
        }
    }

    private async processMediaMessageOld(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.gupshupV3UtilService.getMemberId(payload);
        const memberName = this.gupshupV3UtilService.getMemberName(payload);
        const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

        try {
            this.externalDataService.checkMissingResponse(
                payload.entry[0].changes[0].value.messages[0].from,
                channelConfigToken,
            );
            await this.gupshupV3UtilService.setGupshupIdHash(
                payload.entry[0].changes[0].value.messages[0].id,
                payload.entry[0].changes[0].value.messages[0].id,
            );
            await this.awaiterDelay(payload.entry[0].changes[0].value.messages[0].from, channelConfigToken);

            // For Meta webhook format, we need to extract media ID and download from Meta's API
            const mediaId =
                payload.entry[0].changes[0].value.messages[0]?.['image']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['video']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['audio']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['document']?.id ||
                payload.entry[0].changes[0].value.messages[0]?.['sticker']?.id;

            if (!mediaId) {
                this.logger.warn('No media ID found in Meta webhook payload', JSON.stringify(payload));
                return;
            }

            // GET MEDIA FROM META API
            const instance = this.gupshupV3UtilService.getAxiosInstance();
            const mediaInfo = await instance.get(encodeURI(mediaId), {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: channelConfigToken,
                },
            });
            if (mediaInfo.status > 300) {
                const bufferError = Buffer.from(mediaInfo.data, 'binary');
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processMediaMessage Meta API response.status > 300',
                    extra: {
                        err: bufferError.toString(),
                    },
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Error Meta API', bufferError.toString());
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
                    Authorization: channelConfigToken,
                },
            });

            if (response.status > 300) {
                const bufferError = Buffer.from(response.data, 'binary');
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processMediaMessage Meta media download response.status > 300',
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
            const fileToUpload = {
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
            let messageText: string = this.gupshupV3UtilService.getText(payload);

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
                        'ERROR GupshupV3IncomingService.processMediaMessage validate block inbound message: ',
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
                        gupshupAppName: channelConfig.configData.appName,
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
            console.log('GupshupV3Service.processMediaMessage', e);
            try {
                let messageErr = e;
                if (e?.response?.data?.toString && typeof e?.response?.data?.toString == 'function') {
                    messageErr = e?.response?.data?.toString();
                }
                if (e?.toString && typeof e?.toString == 'function') {
                    messageErr = e?.toString?.();
                }
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processMediaMessage',
                    extra: {
                        error: messageErr,
                        payload: JSON.stringify(payload),
                    },
                });
            } catch (e) {
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processMediaMessage catch 2',
                    extra: {
                        error: e,
                    },
                });
            }
        }
    }

    async handleWhatsappMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string, workspaceId?: string) {
        let result = null;
        try {
            if (
                payload?.entry?.[0]?.changes?.[0]?.field === 'messages' &&
                !!payload.entry[0].changes[0]?.value?.messages?.[0]
            ) {
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
                    default: {
                        console.log('GUPSHUP-V3 message nao tratada', JSON.stringify(payload));
                    }
                }
            } else {
                console.log('GUPSHUP-V3 handleWhatsappMessage nao tratada', JSON.stringify(payload));
            }

            return result;
        } catch (e) {
            console.log(e);

            Sentry.captureException(e);

            throw e;
        }
    }

    // private async processInteractiveMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
    //     if (payload.entry[0].changes[0].value.messages[0].interactive?.nfm_reply?.name !== 'flow') {
    //         return;
    //     }

    //     const memberId = this.gupshupV3UtilService.getMemberId(payload);
    //     const memberName = this.gupshupV3UtilService.getMemberName(payload);

    //     let responseFlow = {};
    //     let flow: Flow;
    //     try {
    //         responseFlow = JSON.parse(
    //             payload.entry[0].changes[0].value.messages[0].interactive?.nfm_reply?.response_json,
    //         );
    //     } catch (e) {
    //         console.log('Error processInteractiveMessage parse JSON: ', JSON.stringify(e));
    //         return null;
    //     }

    //     if (responseFlow?.['flow_token'] !== 'unused') {
    //         flow = await this.externalDataService.getFlowById(responseFlow['flow_token']);
    //     }

    //     if (!flow) {
    //         console.log('Error not found Flow: ', JSON.stringify(payload));
    //         return null;
    //     }

    //     this.externalDataService.checkMissingResponse(memberId, channelConfigToken);
    //     const hash = this.gupshupV3UtilService.getHash(payload);
    //     await this.gupshupV3UtilService.setGupshupIdHash(hash, hash);
    //     await this.awaiterDalay(memberId, channelConfigToken);
    //     const quoted = await this.getQuoted(payload);

    //     let startActivity: ActivityDto;
    //     let conversation;
    //     try {
    //         conversation = await this.getExistingConversation(channelConfigToken, memberId);
    //     } catch (e) {
    //         this.logger.error('processTextMessage');
    //         console.error(e);
    //         Sentry.captureException(e);
    //     }

    //     if (!conversation) {
    //         conversation = await this.externalDataService.getExistingConversation(channelConfigToken, memberId);
    //     }

    //     if (!conversation) {
    //         const channelConfig = await this.externalDataService.getOneBtIdOrToken(channelConfigToken);

    //         try {
    //             // Caso não possua conversa criada bloqueia mensagens receptivas, esse canal realiza apenas atendimentos ativos.
    //             if (channelConfig && !!channelConfig?.blockInboundAttendance) {
    //                 return;
    //             }
    //         } catch (error) {
    //             console.log('ERROR gupshupService.handleWhatsappMessage validate block inbound message: ', error);
    //         }

    //         const messageText = this.gupshupV3UtilService.getText(payload);

    //         const r = await this.externalDataService.getConversation({
    //             activityHash: hash,
    //             activityText: messageText,
    //             activityTimestamp: moment().valueOf(),
    //             activityQuoted: quoted,
    //             channelConfigToken,
    //             channelId: ChannelIdConfig.gupshup,
    //             memberChannel: ChannelIdConfig.gupshup,
    //             memberId,
    //             memberName: memberName,
    //             memberPhone: convertPhoneNumber(memberId),
    //             privateConversationData: {
    //                 phoneNumber: channelConfig?.configData?.phoneNumber,
    //                 apikey: channelConfig?.configData?.apikey,
    //                 gupshupAppName: channelConfig.configData.appName,
    //             },
    //             channelConfig,
    //             referralSourceId: null,
    //         });

    //         conversation = r.conversation;
    //         startActivity = r.startActivity;
    //     }

    //     if (!conversation) {
    //         return;
    //     }

    //     if (startActivity) {
    //         return await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
    //     } else {
    //         const activity = await this.gupshupV3UtilService.getActivityDto(payload, conversation);
    //         activity.quoted = quoted;

    //         let contentFlow: any = {};
    //         if (flow?.flowFields) {
    //             const pages = flow.flowFields?.pages?.map((page) => {
    //                 const fields = page?.fields?.map((field) => {
    //                     if (responseFlow?.[field?.name]) {
    //                         const value = responseFlow[field.name];
    //                         return {
    //                             ...field,
    //                             value,
    //                         };
    //                     }
    //                     return field;
    //                 });
    //                 return {
    //                     ...page,
    //                     fields,
    //                 };
    //             });
    //             contentFlow = {
    //                 ...flow.flowFields,
    //                 pages,
    //             };
    //         }

    //         const attachment: Attachment = {
    //             contentType: 'flow_response',
    //             content: contentFlow,
    //         };
    //         activity.attachments = [attachment];

    //         return await this.handleActivity(activity, payload, channelConfigToken, conversation);
    //     }
    // }

    private async processInteractiveMessage(payload: MetaWhatsappWebhookEvent, channelConfigToken: string) {
        const memberId = this.gupshupV3UtilService.getMemberId(payload);
        const memberName = this.gupshupV3UtilService.getMemberName(payload);

        this.externalDataService.checkMissingResponse(memberId, channelConfigToken);
        const hash = this.gupshupV3UtilService.getHash(payload);
        await this.gupshupV3UtilService.setGupshupIdHash(hash, hash);
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
                console.log('ERROR gupshupV3Service.handleWhatsappMessage validate block inbound message: ', error);
            }

            const r = await this.externalDataService.getConversation({
                activityHash: hash,
                activityText: this.gupshupV3UtilService.getText(payload),
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
                    gupshupAppName: channelConfig.configData.appName,
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

        let responseFlow;
        let flow: Flow;

        try {
            try {
                responseFlow = JSON.parse(
                    payload.entry[0].changes[0].value.messages[0].interactive?.nfm_reply?.response_json,
                );
            } catch (e) {
                console.log('Error processInteractiveMessage parse JSON: ', JSON.stringify(e));
            }

            if (!!responseFlow['flow_token'] && responseFlow?.['flow_token'] !== 'unused') {
                flow = await this.externalDataService.getFlowById(responseFlow['flow_token']);

                if (!flow) {
                    console.log('Error not found Flow: ', JSON.stringify(payload));
                }
            }
        } catch (error) {
            console.log('Error process flow message');
        }

        if (startActivity) {
            return await this.handleActivity(startActivity, payload, channelConfigToken, conversation);
        } else {
            const activity = await this.gupshupV3UtilService.getActivityDto(payload, conversation);
            activity.quoted = quoted;

            const replyTitle =
                payload.entry[0].changes[0].value.messages[0]?.interactive?.['button_reply']?.title ||
                payload.entry[0].changes[0].value.messages[0]?.interactive?.['list_reply']?.title ||
                payload.entry[0].changes[0].value.messages[0]?.['button']?.text;

            if (replyTitle) {
                activity.data = {
                    ...(activity?.data || {}),
                    replyTitle,
                };
                const text =
                    payload.entry[0].changes[0].value.messages[0]?.interactive?.['button_reply']?.id ||
                    payload.entry[0].changes[0].value.messages[0]?.interactive?.['list_reply']?.id ||
                    payload.entry[0].changes[0].value.messages[0]?.['button']?.payload;

                if (text) {
                    activity.text = text;
                }
            }

            try {
                let contentFlow: any = {};
                if (!!flow && !!responseFlow && flow?.flowFields) {
                    const pages = flow.flowFields?.pages?.map((page) => {
                        const fields = page?.fields?.map((field) => {
                            if (responseFlow?.[field?.name]) {
                                const value = responseFlow[field.name];
                                return {
                                    ...field,
                                    value,
                                };
                            }
                            return field;
                        });
                        return {
                            ...page,
                            fields,
                        };
                    });
                    contentFlow = {
                        ...flow.flowFields,
                        pages,
                    };
                    const attachment: Attachment = {
                        contentType: 'flow_response',
                        content: contentFlow,
                    };
                    activity.attachments = [attachment];
                    activity.data = { ...(activity.data || {}), ...responseFlow };
                }
            } catch (error) {
                Sentry.captureEvent({
                    message: 'GupshupV3Service.processInteractiveMessage error process flow',
                    extra: {
                        error: error,
                        payload,
                    },
                });
                if (Object.keys(responseFlow)?.length) {
                    activity.data = { ...(activity.data || {}), ...responseFlow };
                }
            }

            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    private async getQuoted(payload: MetaWhatsappWebhookEvent) {
        let quoted;
        const wppId =
            payload?.entry[0].changes[0].value.messages[0].reaction?.message_id ||
            payload?.entry[0].changes[0].value.messages[0].context?.gs_id;

        if (wppId) {
            const client = await this.cacheService.getClient();
            const key = this.gupshupV3UtilService.getActivtyGupshupIdHashCacheKey(wppId);
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

    private async awaiterDalay(phoneNumber: string, channelConfigToken: string) {
        const secondsToWait = await this.cacheService.incr(`${phoneNumber}:${channelConfigToken}`, 10);
        await new Promise((r) => setTimeout(r, (secondsToWait - 1) * 500));
    }

    private async getExistingConversation(channelConfigToken: string, memberId: string) {
        let conversation;
        if (memberId.startsWith('55')) {
            const [option1, option2] = await this.gupshupV3UtilService.getAllPossibleBrIds(memberId);

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
                    message: 'DEBUG GupshupV3IncomingService: empty message',
                    extra: {
                        activityRequest: JSON.stringify(activityRequest),
                        payload: JSON.stringify(payload),
                    },
                });
            }
        } catch (e) {
            Sentry.captureEvent({
                message: 'DEBUG GupshupV3IncomingService: empty message catch',
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
        await this.gupshupV3UtilService.setGupshupIdHash(
            payload.entry[0].changes[0].value.messages[0].id,
            payload.entry[0].changes[0].value.messages[0].id,
        );
        await this.awaiterDelay(payload.entry[0].changes[0].value.messages[0].from, channelConfigToken);
        const quoted = await this.getQuoted(payload);
        const memberId = this.gupshupV3UtilService.getMemberId(payload);
        const memberName = this.gupshupV3UtilService.getMemberName(payload);
        const hash = this.gupshupV3UtilService.getHash(payload);

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
                    'ERROR GupshupV3IncomingService.processReactionMessage validate block inbound message: ',
                    error,
                );
            }

            const messageText = this.gupshupV3UtilService.getText(payload);

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
                    gupshupAppName: channelConfig.configData.appName,
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
            const activity = await this.gupshupV3UtilService.getActivityDto(payload, conversation);
            activity.data = { ...(activity.data || {}), reactionHash: quoted, quoted };
            return await this.handleActivity(activity, payload, channelConfigToken, conversation);
        }
    }

    async updateActivityAck(wppMessageId: string, ack: number, channelConfigToken: string, workspaceId?: string) {
        const timer = ackProcessLatencyLocation.labels('loc1').startTimer();
        const client = await this.cacheService.getClient();
        const key = this.gupshupV3UtilService.getActivtyGupshupIdHashCacheKey(wppMessageId);
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
}
