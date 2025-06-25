import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmtRe } from '../models/smt-re.entity';
import { CONVERSATION_SMT_RE_CONNECTION_NAME } from '../ormconfig';
import { ExternalDataService } from './external-data.service';
import { ActivityType, IdentityType, ConversationCloseType } from 'kissbot-core';
import { SmtReMessageType } from '../interfaces/smt-re-message-type.enum';
import { systemMemberId } from '../../../common/utils/utils';
import { SmtReSettingService } from './smt-re-setting.service';
import { Exceptions } from '../../auth/exceptions';
import * as moment from 'moment-timezone';
import * as Sentry from '@sentry/node';
@Injectable()
export class SmtReService {
    private readonly logger = new Logger(SmtReService.name);

    constructor(
        @InjectRepository(SmtRe, CONVERSATION_SMT_RE_CONNECTION_NAME)
        private readonly smtReRepository: Repository<SmtRe>,
        private readonly externalDataService: ExternalDataService,
        private readonly smtReSettingService: SmtReSettingService,
    ) {}

    async create(conversationId: string, workspaceId: string, smtReSettingId: string, teamId?: string): Promise<SmtRe> {
        // Buscar a configuração SMT-RE para validar se o teamId está permitido
        const smtReSetting = await this.smtReSettingService.findById(smtReSettingId);

        if (!smtReSetting) {
            throw new BadRequestException(`SMT-RE setting with id ${smtReSettingId} not found`);
        }

        if (smtReSetting.workspaceId !== workspaceId) {
            throw new BadRequestException(`SMT-RE setting does not belong to workspace ${workspaceId}`);
        }

        // Validar se o teamId da conversa está na lista de teams permitidos
        if (teamId && smtReSetting.teamIds && smtReSetting.teamIds.length > 0) {
            if (!smtReSetting.teamIds.includes(teamId)) {
                throw Exceptions.SMT_RE_TEAM_NOT_ALLOWED;
            }
        }

        const smtRe = this.smtReRepository.create({
            conversationId,
            workspaceId,
            smtReSettingId,
            createdAt: new Date(),
        });

        return this.smtReRepository.save(smtRe);
    }

    async findLastNonStoopedByConversationId(conversationId: string): Promise<SmtRe> {
        return this.smtReRepository.findOne({
            where: { conversationId, stopped: false },
            relations: ['smtReSetting'],
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async findById(id: string): Promise<SmtRe> {
        return this.smtReRepository.findOne({
            where: { id },
            relations: ['smtReSetting'],
        });
    }

    async findPendingMessages(): Promise<SmtRe[]> {
        const query = this.smtReRepository
            .createQueryBuilder('smtRe')
            .leftJoinAndSelect('smtRe.smtReSetting', 'smtReSetting')
            .where('smtRe.finalizationMessageSent = :finalizationMessageSent', { finalizationMessageSent: false })
            .andWhere('smtRe.stopped = :stopped', { stopped: false });

        return query.getMany();
    }

    async updateInitialMessageSent(id: string): Promise<void> {
        await this.smtReRepository.update(id, {
            initialMessageSent: true,
            initialMessageSentAt: moment().toDate(),
        });
    }

    async updateAutomaticMessageSent(id: string): Promise<void> {
        await this.smtReRepository.update(id, {
            automaticMessageSent: true,
            automaticMessageSentAt: moment().toDate(),
        });
    }

    async updateFinalizationMessageSent(id: string): Promise<void> {
        await this.smtReRepository.update(id, {
            finalizationMessageSent: true,
            finalizationMessageSentAt: moment().toDate(),
        });
    }

    async sendPendingSmtRe(): Promise<void> {
        this.logger.debug('Checking for pending messages to send...');

        try {
            const pendingSmtReList = await this.findPendingMessages();
            this.logger.debug(`Found ${pendingSmtReList.length} pending SMT-RE messages`);

            for (const pendingSmtRe of pendingSmtReList) {
                try {
                    const now = moment.utc();
                    this.logger.debug(
                        `Processing SMT-RE ${pendingSmtRe.id} for conversation ${pendingSmtRe.conversationId}`,
                    );

                    // Check if initial message should be sent
                    if (!pendingSmtRe.initialMessageSent) {
                        this.logger.debug(`Checking initial message for SMT-RE ${pendingSmtRe.id}`);
                        const initialSendTime = moment(pendingSmtRe.createdAt).add(
                            pendingSmtRe.smtReSetting.initialWaitTime,
                            'minutes',
                        );
                        this.logger.debug(
                            `Initial message time check - now: ${now.format()}, sendTime: ${initialSendTime.format()}, shouldSend: ${now.isSameOrAfter(
                                initialSendTime,
                            )}`,
                        );

                        if (now.valueOf() >= initialSendTime.valueOf()) {
                            await this.sendMessage(pendingSmtRe, SmtReMessageType.INITIAL);
                            await this.externalDataService.addTags(pendingSmtRe.conversationId, [
                                { color: '#678f78', name: '@remi.assume' },
                            ]);
                            await this.updateInitialMessageSent(pendingSmtRe.id);
                            this.logger.log(`Initial message sent for conversation ${pendingSmtRe.conversationId}`);
                        }
                    }
                    // Check if automatic message should be sent
                    else if (!pendingSmtRe.automaticMessageSent && pendingSmtRe.initialMessageSentAt) {
                        this.logger.debug(`Checking automatic message for SMT-RE ${pendingSmtRe.id}`);
                        const automaticSendTime = moment(pendingSmtRe.initialMessageSentAt).add(
                            pendingSmtRe.smtReSetting.automaticWaitTime,
                            'minutes',
                        );
                        this.logger.debug(
                            `Automatic message time check - now: ${now.format()}, sendTime: ${automaticSendTime.format()}, shouldSend: ${now.isSameOrAfter(
                                automaticSendTime,
                            )}`,
                        );

                        if (now.isSameOrAfter(automaticSendTime)) {
                            await this.sendMessage(pendingSmtRe, SmtReMessageType.AUTOMATIC);
                            await this.updateAutomaticMessageSent(pendingSmtRe.id);
                            this.logger.log(`Automatic message sent for conversation ${pendingSmtRe.conversationId}`);
                        }
                    }
                    // Check if finalization message should be sent
                    else if (!pendingSmtRe.finalizationMessageSent && pendingSmtRe.automaticMessageSentAt) {
                        this.logger.debug(`Checking finalization message for SMT-RE ${pendingSmtRe.id}`);
                        const finalizationSendTime = moment(pendingSmtRe.automaticMessageSentAt).add(
                            pendingSmtRe.smtReSetting.finalizationWaitTime,
                            'minutes',
                        );
                        this.logger.debug(
                            `Finalization message time check - now: ${now.format()}, sendTime: ${finalizationSendTime.format()}, shouldSend: ${now.isSameOrAfter(
                                finalizationSendTime,
                            )}`,
                        );

                        if (now.isSameOrAfter(finalizationSendTime)) {
                            await this.sendMessage(pendingSmtRe, SmtReMessageType.FINALIZATION);
                            await this.externalDataService.addTags(pendingSmtRe.conversationId, [
                                { color: '#8e8f67', name: '@remi.finaliza' },
                            ]);
                            await this.updateFinalizationMessageSent(pendingSmtRe.id);
                            this.logger.log(
                                `Finalization message sent for conversation ${pendingSmtRe.conversationId}`,
                            );
                        }
                    }
                } catch (e) {
                    Sentry.captureEvent({
                        message: 'SmtReService.sendPendingSmtRe',
                        extra: {
                            error: e,
                            pendingSmtRe,
                        },
                    });
                }
            }
        } catch (error) {
            this.logger.error('Error in message scheduling:', error);
            this.logger.debug('Error details:', error.stack);
        }
    }

    private async sendMessage(smtRe: SmtRe, messageType: SmtReMessageType): Promise<void> {
        try {
            const smtReId = smtRe.id;
            // Get conversation using external data service
            const conversation = await this.externalDataService.getConversationById(smtRe.conversationId);
            const messagesByType = {
                [SmtReMessageType.AUTOMATIC]: smtRe.smtReSetting.automaticMessage,
                [SmtReMessageType.FINALIZATION]: smtRe.smtReSetting.finalizationMessage,
                [SmtReMessageType.INITIAL]: smtRe.smtReSetting.initialMessage,
            };
            const messageText = messagesByType[messageType];
            let sysMember = conversation.members.find((member) => member.type === IdentityType.system);
            if (!sysMember) {
                sysMember = {
                    channelId: 'system',
                    id: systemMemberId,
                    name: 'system',
                    type: IdentityType.system,
                };
                await this.externalDataService.addMember(conversation._id, sysMember);
            }
            const activity: any = {
                type: ActivityType.message,
                from: sysMember,
                text: messageText,
                data: {
                    omitSocket: false,
                },
                conversationId: smtRe.conversationId,
            };

            // Dispatch message activity
            await this.externalDataService.dispatchMessageActivity(conversation, activity);

            if (messageType === SmtReMessageType.INITIAL) {
                await this.externalDataService.updateConversationIsWithSmtRe(smtRe.conversationId);
            }
            // Se for mensagem de finalização, enviar activity end_conversation
            if (messageType === SmtReMessageType.FINALIZATION) {
                await this.externalDataService.dispatchEndConversationActivity(smtRe.conversationId, sysMember, {
                    closeType: ConversationCloseType.bot_finished,
                });
                this.logger.log(`End conversation activity sent for smt-re: ${smtReId}`);
            }

            this.logger.log(`Message sent successfully for smt-re: ${smtReId}`);
        } catch (error) {
            this.logger.error(`Error sending message for smt-re ${smtRe.id}:`, error);
            throw error;
        }
    }

    async stopSmtRe(conversationId: string, memberId?: string): Promise<void> {
        try {
            const smtRe = await this.findLastNonStoopedByConversationId(conversationId);
            if (!smtRe) return;
            if (smtRe.stopped) return;
            await this.smtReRepository.update(smtRe.id, {
                stopped: true,
                stoppedAt: moment().toDate(),
                stoppedByMemberId: memberId,
            });
        } catch (error) {
            this.logger.error(`Error stopping automatic messages for conversation ${conversationId}:`, error);
            throw error;
        }
    }
}
