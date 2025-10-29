import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InitiateCampaignDto } from '../dto/initiate-campaign.dto';
import { EventsService } from '../../events/events.service';
import { KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { CampaignConfigService } from './campaign-config.service';
import { SendedCampaignService } from './sended-campaign.service';
import { IncomingRequestService } from './incoming-request.service';

@Injectable()
export class EmailCampaignService {
    private readonly logger = new Logger(EmailCampaignService.name);

    constructor(
        private readonly campaignConfigService: CampaignConfigService,
        private readonly sendedCampaignService: SendedCampaignService,
        private readonly incomingRequestService: IncomingRequestService,
        private readonly eventsService: EventsService,
    ) {}

    async enqueueEmailCampaign(data: InitiateCampaignDto): Promise<{ requestId: string; message: string }> {
        const campaignConfig = await this.campaignConfigService.findById(data.campaignId);

        if (!campaignConfig.isActive) {
            throw new BadRequestException('Campaign is not active');
        }

        const now = new Date();
        if (now < campaignConfig.startAt || now > campaignConfig.endAt) {
            throw new BadRequestException('Campaign is not within active period');
        }

        const requestId = uuidv4();

        await this.incomingRequestService.create({
            requestId,
            campaignId: data.campaignId,
            workspaceId: campaignConfig.workspaceId,
            recipients: data.recipients,
            templateAttributes: data.templateAttributes,
            conversationAttributes: data.conversationAttributes,
            status: 'pending',
        });

        await this.eventsService.sendEvent(
            {
                data: {
                    ...data,
                    requestId,
                },
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.EMAIL_CAMPAIGN_PROCESS,
            },
            'email.campaign.process',
        );

        return {
            requestId,
            message: `Email campaign enqueued successfully. ${data.recipients.length} recipients will be processed in background.`,
        };
    }

    async handleCallback(shortId: string): Promise<{ redirectUrl: string }> {
        const sendingRecord = await this.sendedCampaignService.findByShortIdOrFail(shortId);

        const campaignConfig = await this.campaignConfigService.getById(
            sendingRecord.campaignConfigId,
            sendingRecord.workspaceId,
        );

        const isExpired = await this.sendedCampaignService.isExpired(sendingRecord);

        await this.sendedCampaignService.incrementClickCount(shortId);

        if (isExpired) {
            await this.sendedCampaignService.markAsExpiredAccess(shortId);

            const whatsappUrl = this.buildWhatsAppUrl(campaignConfig.clinicWhatsapp, campaignConfig.linkMessage);
            return { redirectUrl: whatsappUrl };
        }

        if (sendingRecord.recipientWhatsapp && !isExpired) {
            await this.createConversation(sendingRecord, campaignConfig);
        }

        const whatsappUrl = this.buildWhatsAppUrl(campaignConfig.clinicWhatsapp, campaignConfig.linkMessage);
        return { redirectUrl: whatsappUrl };
    }

    private async createConversation(sendingRecord: any, campaignConfig: any): Promise<string> {
        try {
            const event = {
                apiToken: campaignConfig.apiToken,
                phoneNumber: sendingRecord.recipientWhatsapp,
                externalId: sendingRecord.shortId,
                workspaceId: sendingRecord.workspaceId,
                attributes: sendingRecord.recipientAttributes,
                omitAction: false,
            };

            await this.eventsService.sendEvent({
                data: event,
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.SEND_MESSAGE,
            });

            return;
        } catch (error) {
            this.logger.error(`Failed to create conversation for shortId: ${sendingRecord.shortId}`, error);
            return;
        }
    }

    private buildWhatsAppUrl(clinicWhatsapp: string, message: string): string {
        const cleanedNumber = clinicWhatsapp.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
    }
}
