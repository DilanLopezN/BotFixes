// import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email } from '../models/email.entity';
import { EMAIL_CONNECTION } from '../ormconfig';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailEvent, EmailEventStatus } from '../models/email-event.entity';
import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';
import { KissbotEventType } from 'kissbot-core';
import { BadRequestException } from '@nestjs/common';
import { EmailTemplateData } from '../models/email-template-data.entity';
import { SendgridEmailStatusDto } from '../dto/sendgrid-email-status.dto';
import { CacheService } from '../../_core/cache/cache.service';
import { orderBy } from 'lodash';
import { EmailType } from '../interfaces/email.interface';

export const emailStatusTopic = 'email_status';
export class EmailSenderService {
    constructor(
        @InjectRepository(Email, EMAIL_CONNECTION)
        private emailRepository: Repository<Email>,
        @InjectRepository(EmailEvent, EMAIL_CONNECTION)
        private emailEventRepository: Repository<EmailEvent>,
        @InjectRepository(EmailTemplateData, EMAIL_CONNECTION)
        private templateDataRepository: Repository<EmailTemplateData>,
        private kafkaService: KafkaService,
        public cacheService: CacheService,
    ) {}

    getAmountEmailsSentCacheKey() {
        return `AMOUNT_EMAIL_SENT`;
    }

    async sendEmail(workspaceId: string, data: SendEmailDto): Promise<{ ok: boolean }> {
        const client = this.cacheService.getClient();
        const key = this.getAmountEmailsSentCacheKey();
        const amountEmailSent = await client.get(key);
        if (amountEmailSent && Number(amountEmailSent) >= 100) {
            // se a quantidade de emails enviados ultrapassou o limite de 100 no dia não deve enviar mais
            // Esse limite esta sendo implementado pois a conta de email é nova e tem um limite baixo
            return { ok: false };
        }

        if (!data.content && !data.templateId) throw new BadRequestException('Content or templateId are necessary');
        if (data.templateId && data?.type !== EmailType.invite) delete data.content;

        let content = data.content;
        const html = data.html;
        const text = data.text;

        if (data?.type === EmailType.invite) {
            try {
                if (data.content) {
                    content = Buffer.from(data.content).toString('base64');
                }
            } catch (error) {
                throw new BadRequestException('Error convert content to string base64');
            }
        }

        if (data.templateId) {
            delete data.html;
            delete data.text;
        }
        const email = await this.emailRepository.save({
            ...data,
            content,
            workspaceId,
            createdAt: new Date(),
        });
        if (data.templateData) {
            const entries = Object.entries(data.templateData);
            for (const [field, value] of entries) {
                await this.templateDataRepository.save({
                    emailId: email.id,
                    field,
                    value,
                    createdAt: new Date(),
                });
            }
        }

        let msg;
        switch (data?.type) {
            case EmailType.invite:
                msg = {
                    to: data.to,
                    from: {
                        email: data.fromEmail,
                        name: data.fromTitle,
                    },
                    subject: data.subject,
                    text: text,
                    html: html,
                    attachments: [
                        {
                            content: content,
                            filename: 'convite.ics',
                            type: 'text/calendar',
                            disposition: 'attachment',
                        },
                    ],
                };
                break;
            default:
                msg = {
                    to: data.to,
                    from: {
                        email: data.fromEmail,
                        name: data.fromTitle,
                    },
                    subject: data.subject,
                    text: data.content,
                    html: data.content,
                    templateId: data.templateId,
                    dynamicTemplateData: data.templateData,
                    custom_args: {
                        emailId: email.id,
                    },
                };

                if (data?.unsubscribeGroupId) {
                    msg.asm = {
                        group_id: data.unsubscribeGroupId,
                    };
                }
                break;
        }

        try {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            await sgMail.send(msg);
            this.kafkaService.sendEvent(
                { eventType: KissbotEventType.EMAIL_SENT, workspaceId, externalId: email.externalId },
                workspaceId,
                emailStatusTopic,
            );
        } catch (error) {
            console.error(error);
            return { ok: false };
        }
        await client.incr(key);
        await client.expire(key, 86400);
        return { ok: true };
    }

    async processSendGridEvents(events: Array<SendgridEmailStatusDto>): Promise<void> {
        for (const event of orderBy(events, 'timestamp', 'asc')) {
            const emailId = event.emailId;
            const status = EmailEventStatus[event.event];

            if (!emailId || !status) continue;

            await this.emailEventRepository.save({
                emailId,
                status,
                createdAt: new Date(),
            });

            const email = await this.emailRepository.findOne(emailId);

            switch (status) {
                case EmailEventStatus.delivered: {
                    this.kafkaService.sendEvent(
                        {
                            eventType: KissbotEventType.EMAIL_DELIVERED,
                            workspaceId: email.workspaceId,
                            externalId: email.externalId,
                        },
                        email.workspaceId,
                        emailStatusTopic,
                    );
                    break;
                }
                case EmailEventStatus.open: {
                    this.kafkaService.sendEvent(
                        {
                            eventType: KissbotEventType.EMAIL_OPENED,
                            workspaceId: email.workspaceId,
                            externalId: email.externalId,
                        },
                        email.workspaceId,
                        emailStatusTopic,
                    );
                    break;
                }
            }
        }
    }

    async getTemplatesSendGrid() {
        sgClient.setApiKey(process.env.SENDGRID_API_KEY);
        const queryParams = {
            page_size: 100,
            generations: 'dynamic',
        };
        return await sgClient
            .request({ url: '/v3/templates', method: 'GET', qs: queryParams })
            .then(([response, body]) => {
                if (body?.result) {
                    return body.result;
                }
                return [];
            })
            .catch((error) => {
                console.log('ERROR EmailSenderService.getTemplatesSendGrid: ', JSON.stringify(error));
                return null;
            });
    }

    async getTemplateSendGridById(templateId: string) {
        sgClient.setApiKey(process.env.SENDGRID_API_KEY);
        return await sgClient
            .request({ url: `/v3/templates/${templateId}`, method: 'GET' })
            .then(([response]) => {
                if (response.body) {
                    return response.body;
                }
                return null;
            })
            .catch((error) => {
                console.log('ERROR EmailSenderService.getTemplateSendGridById: ', JSON.stringify(error));
                return null;
            });
    }
}
