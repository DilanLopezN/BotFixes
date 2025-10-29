import { Injectable, Logger } from '@nestjs/common';
import { ActivityType, ChannelIdConfig } from 'kissbot-core';
import { ExternalDataService } from './external-data.service';
import { CompleteChannelConfig } from '../../../channel-config/channel-config.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../common/utils/prom-metrics';
import { Activity } from '../../../activity/interfaces/activity';
import { Conversation } from '../../../conversation/interfaces/conversation.interface';
import { ResponseMessageWhatsapp } from '../interfaces/response-message-whatsapp.interface';
import * as Sentry from '@sentry/node';
import { PayloadMessageWhatsapp } from '../interfaces/payload-message-whatsapp.interface';
import { WhatsappUtilService } from './whatsapp-util.service';
import { WhatsappIdHashService } from './whatsapp-id-hash.service';

@Injectable()
export class WhatsappOutcomingConsumerService {
    private readonly logger = new Logger(WhatsappOutcomingConsumerService.name);

    constructor(
        private readonly whatsappUtilService: WhatsappUtilService,
        private readonly externalDataService: ExternalDataService,
        private readonly whatsappIdHashService: WhatsappIdHashService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: ChannelIdConfig.gupshup + '-v2.outgoing',
        queue: ChannelIdConfig.gupshup + '-v2.outgoing',
        queueOptions: {
            durable: true,
            channel: 'GupshupChannelConsumer',
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async processEvent(event) {
        const timer = rabbitMsgLatency.labels(WhatsappOutcomingConsumerService.name).startTimer();
        rabbitMsgCounter.labels(WhatsappOutcomingConsumerService.name).inc();
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

            const channelConfig = await this.externalDataService.getChannelConfigByToken(conversation.token);

            let response: ResponseMessageWhatsapp;

            try {
                try {
                    if (activity.isHsm && activity.data?.wabaTemplateId) {
                        response = await this.sendTemplateMessage(activity, channelConfig);
                    } else if (
                        activity.attachments?.[0].content.buttons.length === 1 &&
                        activity.attachments?.[0].content?.buttons?.[0]?.type === 'flow'
                    ) {
                        response = await this.sendFlowMessage(activity, channelConfig);
                    } else if (
                        activity.attachments?.[0].content.buttons.length === 1 &&
                        activity.attachments?.[0].content?.buttons?.[0]?.type === 'openUrl'
                    ) {
                        response = await this.sendCtaUrlMessage(activity, channelConfig);
                    } else if (
                        activity.attachments?.[0]?.content?.buildAsQuickReply &&
                        activity?.attachments?.[0]?.content?.buttons?.length <= 3
                    ) {
                        response = await this.sendQuickReplyMessage(activity, channelConfig);
                    } else if (
                        activity?.attachments?.[0]?.content?.buildAsList &&
                        activity?.attachments?.[0]?.content?.buttons?.length <= 10
                    ) {
                        response = await this.sendListMessage(activity, channelConfig);
                    } else {
                        if (
                            (activity.attachmentFile &&
                                activity.attachmentFile?.contentUrl &&
                                activity.attachmentFile?.contentUrl != ' ') ||
                            (activity.attachmentFile &&
                                activity.attachmentFile?.['id'] &&
                                activity.attachmentFile?.['id'] != ' ')
                        ) {
                            response = await this.sendMediaMessage(activity, channelConfig);
                        } else if (activity.text) {
                            if (activity?.data?.reactionHash) {
                                response = await this.sendReactionMessage(activity, channelConfig);
                            } else {
                                response = await this.sendTextMessage(activity, channelConfig);
                            }
                        }
                    }
                } catch (e) {
                    const m = `${WhatsappOutcomingConsumerService.name}.processEvent`;
                    this.logger.error(m);
                    console.log(e);
                    Sentry.captureEvent({
                        message: m,
                        extra: {
                            error: e,
                        },
                    });
                }

                if (!response) {
                    this.logger.error('Error on send:' + JSON.stringify(activity));
                    this.logger.error('Error on send2:' + JSON.stringify(response));
                }

                await this.whatsappIdHashService.createAndSetWppIdHash(response, channelConfig, activity, conversation);
            } catch (e) {
                rabbitMsgCounterError.labels(WhatsappOutcomingConsumerService.name).inc();
                if (e?.response?.status > 300) {
                    // TODO: implementar ack de erro na request pro provide
                }
                this.logger.error('WhatsappConsumerService.registerChannel');
                this.logger.error(e);
            }
        } catch (e) {
            console.log('Error on WhatsappOutcomingConsumerService', e);
            rabbitMsgCounterError.labels(WhatsappOutcomingConsumerService.name).inc();
        }
        timer();
    }

    /**
     *  Functions to send messages
     */

    async sendTextMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingTextMessage(payloadData, channelConfig);
    }

    async sendQuickReplyMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingQuickReply(payloadData, channelConfig);
    }

    async sendListMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingListMessage(payloadData, channelConfig);
    }

    async sendFlowMessage(
        activity: Activity,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingFlowMessage(payloadData, channelConfig);
    }

    async sendCtaUrlMessage(
        activity: Activity,
        channelConfig: CompleteChannelConfig,
    ): Promise<ResponseMessageWhatsapp | any> {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingCtaUrl(payloadData, channelConfig);
    }

    async sendMediaMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        if (activity.attachmentFile.contentType.startsWith('image')) {
            return await this.sendImageMessage(activity, channelConfig);
        } else if (activity.attachmentFile.contentType.startsWith('video')) {
            return await this.sendVideoMessage(activity, channelConfig);
        } else if (activity.attachmentFile.contentType.startsWith('audio')) {
            return await this.sendAudioMessage(activity, channelConfig);
        } else {
            return await this.sendDocumentMessage(activity, channelConfig);
        }
    }

    async sendAudioMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingAudioMessage(payloadData, channelConfig);
    }

    async sendImageMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingImageMessage(payloadData, channelConfig);
    }

    async sendVideoMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingVideoMessage(payloadData, channelConfig);
    }

    async sendDocumentMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingDocumentMessage(payloadData, channelConfig);
    }

    async sendReactionMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingReactionMessage(payloadData, channelConfig);
    }

    async sendTemplateMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        const payloadData: PayloadMessageWhatsapp = {
            activity,
        };

        return await service.sendOutcomingTemplateMessage(payloadData, channelConfig);
    }

    // async sendButtonMessage(activity: Activity, channelConfig: CompleteChannelConfig) {
    //     const { service, channelData } = await this.whatsappUtilService.getService(
    //         castObjectIdToString(channelConfig._id),
    //         channelConfig,
    //     );

    //     const payloadData: PayloadMessageWhatsapp = {
    //         type: ChannelTypeWhatsapp.gupshup,
    //         phone_destination: activity.to.id,
    //         payload: {},
    //     };

    //     switch (channelConfig?.channelId) {
    //         case ChannelIdConfig.gupshup:
    //             payloadData.payload = (await this.externalDataService.transformActivityToPayloadGupshup(
    //                 activity,
    //                 PayloadGupshupTypes.PayloadInteractiveMessage,
    //             )) as PayloadInteractiveMessage;
    //             break;

    //         default:
    //             break;
    //     }

    //     return await service.sendOutcomingButtonMessage(payloadData, channelConfig);
    // }

    async getPreviewFlowURL(channelConfig: CompleteChannelConfig, flowId: string) {
        const service = await this.whatsappUtilService.getService(channelConfig);

        return await service.getPreviewFlowURL(channelConfig, flowId);
    }
}
