import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../common/utils/prom-metrics';
import { EmailCampaignEventDto } from '../dto/email-campaign-event.dto';
import { InitiateCampaignDto } from '../dto/initiate-campaign.dto';
import { ShortIdUtil } from '../utils/short-id.util';
import { validateEmail, validateWhatsApp } from '../utils/validator.util';
import { NotFoundException } from '@nestjs/common';
import * as moment from 'moment';
import { KissbotEventType } from 'kissbot-core';
import { EmailPayload } from '../interfaces/email-paylod.interface';
import { CampaignConfigService } from './campaign-config.service';
import { SendedCampaignService } from './sended-campaign.service';
import { IncomingRequestService } from './incoming-request.service';
import { KafkaService } from '../../_core/kafka/kafka.service';

@Injectable()
export class EmailCampaignConsumerService {
    private readonly logger = new Logger(EmailCampaignConsumerService.name);
    private readonly baseCallbackUrl: string;

    constructor(
        private readonly campaignConfigService: CampaignConfigService,
        private readonly sendedCampaignService: SendedCampaignService,
        private readonly incomingRequestService: IncomingRequestService,
        private readonly kafkaService: KafkaService,
    ) {
        this.baseCallbackUrl = process.env.API_URI || 'http://localhost:9091';
    }

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: 'email.campaign.process',
        queue: getQueueName('email-campaign-processor'),
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: EmailCampaignConsumerService.name,
        },
    })
    async handleEmailCampaignMessage(event: EmailCampaignEventDto) {
        const timer = rabbitMsgLatency.labels(EmailCampaignConsumerService.name).startTimer();
        rabbitMsgCounter.labels(EmailCampaignConsumerService.name).inc();

        try {
            this.logger.log(
                `Processing email campaign ${event.data.campaignId} with requestId: ${event.data.requestId || ''}`,
            );

            await this.executeEmailCampaignProcessing(event.data);

            this.logger.log(`Email campaign ${event.data.campaignId} processed successfully`);
        } catch (error) {
            this.logger.error(`Error processing email campaign ${event.data.campaignId}:`, error);
            rabbitMsgCounterError.labels(EmailCampaignConsumerService.name).inc();
        } finally {
            timer();
        }
    }

    async executeEmailCampaignProcessing(data: InitiateCampaignDto): Promise<void> {
        const incomingRequest = await this.incomingRequestService.findByRequestId(data.requestId);

        if (!incomingRequest) {
            this.logger.error(`Incoming request not found for requestId: ${data.requestId}`);
            throw new NotFoundException('Incoming request not found');
        }

        let campaignConfig;
        try {
            campaignConfig = await this.campaignConfigService.getById(data.campaignId, incomingRequest.workspaceId);
        } catch (error) {
            await this.incomingRequestService.markAsFailed(data.requestId);
            throw new NotFoundException('Campaign config not found');
        }

        let processedCount = 0;
        let errorCount = 0;

        for (const recipient of data.recipients) {
            try {
                const shortId = ShortIdUtil.generate(
                    campaignConfig.id,
                    recipient.email || recipient.whatsapp || '',
                    data.requestId,
                    Date.now().toString(),
                );
                const expiredAt = moment().add(campaignConfig.linkTtlMinutes, 'minutes').toDate();

                let error: string | undefined;
                let status = 'pending';

                if (recipient.email && !validateEmail(recipient.email)) {
                    error = 'Invalid email format';
                    status = 'error';
                }

                if (recipient.whatsapp && !validateWhatsApp(recipient.whatsapp)) {
                    error = error ? `${error}; Invalid WhatsApp format` : 'Invalid WhatsApp format';
                    status = 'error';
                }

                const variableEmail = data.templateAttributes.reduce((curr, tt) => {
                    return { ...curr, [tt.name]: tt.value };
                }, {});

                const recipienteVariables = recipient.attributes.reduce((curr, tt) => {
                    return { ...curr, [tt.name]: tt.value };
                }, {});

                const templateData = {
                    ...variableEmail,
                    ...recipienteVariables,
                    callback_url: `${this.baseCallbackUrl}/c/${shortId}`,
                };

                const sendingRecord = await this.sendedCampaignService.create({
                    shortId,
                    workspaceId: campaignConfig.workspaceId,
                    campaignConfigId: campaignConfig.id,
                    recipientEmail: recipient.email,
                    recipientWhatsapp: recipient.whatsapp,
                    recipientAttributes: [...(recipient.attributes || []), ...(data.conversationAttributes || [])],
                    templateData,
                    expiredAt,
                    error,
                    status,
                });

                if (recipient.email && !error) {
                    const emailSent = await this.sendEmail({
                        to: recipient.email,
                        fromTitle: campaignConfig.fromTitle,
                        workspaceId: campaignConfig.workspaceId,
                        externalId: shortId,
                        templateId: campaignConfig.emailTemplateId,
                        templateData: templateData,
                    });

                    if (emailSent) {
                        await this.sendedCampaignService.markEmailAsSent(sendingRecord.id);
                        processedCount++;
                    } else {
                        await this.sendedCampaignService.markAsError(sendingRecord.id, 'Failed to send email');
                        errorCount++;
                    }
                } else if (error) {
                    errorCount++;
                }

                this.logger.log(
                    `Processed recipient ${recipient.email || recipient.whatsapp} with shortId: ${shortId}`,
                );
            } catch (error) {
                this.logger.error(`Error processing recipient: ${JSON.stringify(recipient)}`, error);
                errorCount++;
            }
        }

        await this.incomingRequestService.markAsCompleted(data.requestId, processedCount, errorCount);

        this.logger.log(`Campaign ${data.campaignId} completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    }

    async sendEmail(payload: EmailPayload): Promise<boolean> {
        try {
            const emailEventData = {
                fromEmail: payload.fromEmail || 'mkt@atend.clinic',
                fromTitle: payload.fromTitle,
                subject: '__',
                to: payload.to,
                content: null,
                workspaceId: payload.workspaceId,
                externalId: payload.externalId,
                templateId: payload.templateId,
                templateData: payload.templateData,
                unsubscribeGroupId: null,
            };

            await this.kafkaService.sendEvent(emailEventData, payload.workspaceId, KissbotEventType.EMAIL_CREATED);

            this.logger.log(`Email sent to ${payload.to} with template ${payload.templateId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${payload.to}`, error);
            return false;
        }
    }
}
