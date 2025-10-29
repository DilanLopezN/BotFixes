import { Injectable, BadRequestException } from '@nestjs/common';
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
import { Conversation } from '../../conversation/interfaces/conversation.interface';
import { CategorizationType } from '../../conversation-categorization-v2/interfaces/categorization-type';
@Injectable()
export class SmtReService {
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

        // Validar se a configuração está ativa
        if (!smtReSetting.active) {
            throw new BadRequestException(`SMT-RE setting with id ${smtReSettingId} is not active`);
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

        return await this.smtReRepository.save(smtRe);
    }

    async findLastByConversationId(conversationId: string): Promise<SmtRe> {
        return this.smtReRepository.findOne({
            where: { conversationId },
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
            .andWhere('smtRe.stopped = :stopped', { stopped: false })
            .andWhere('smtReSetting.active = :active', { active: true });

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
        try {
            const pendingSmtReList = await this.findPendingMessages();

            for (const pendingSmtRe of pendingSmtReList) {
                try {
                    const now = moment.utc();

                    // Check if initial message should be sent
                    if (!pendingSmtRe.initialMessageSent) {
                        const initialSendTime = moment(pendingSmtRe.createdAt).add(
                            pendingSmtRe.smtReSetting.initialWaitTime,
                            'minutes',
                        );

                        if (now.valueOf() >= initialSendTime.valueOf()) {
                            await this.externalDataService.sendStmReActivity(pendingSmtRe, ActivityType.smt_re_assumed);
                            await this.sendMessage(pendingSmtRe, SmtReMessageType.INITIAL);
                            await this.externalDataService.addTags(pendingSmtRe.conversationId, [
                                { color: '#678f78', name: '@remi.assume' },
                            ]);
                            await this.updateInitialMessageSent(pendingSmtRe.id);
                        }
                    }
                    // Check if automatic message should be sent
                    else if (!pendingSmtRe.automaticMessageSent && pendingSmtRe.initialMessageSentAt) {
                        const automaticSendTime = moment(pendingSmtRe.initialMessageSentAt).add(
                            pendingSmtRe.smtReSetting.automaticWaitTime,
                            'minutes',
                        );

                        if (now.isSameOrAfter(automaticSendTime)) {
                            await this.sendMessage(pendingSmtRe, SmtReMessageType.AUTOMATIC);
                            await this.updateAutomaticMessageSent(pendingSmtRe.id);
                        }
                    }
                    // Check if finalization message should be sent
                    else if (!pendingSmtRe.finalizationMessageSent && pendingSmtRe.automaticMessageSentAt) {
                        const finalizationSendTime = moment(pendingSmtRe.automaticMessageSentAt).add(
                            pendingSmtRe.smtReSetting.finalizationWaitTime,
                            'minutes',
                        );

                        if (now.isSameOrAfter(finalizationSendTime)) {
                            await this.sendMessage(pendingSmtRe, SmtReMessageType.FINALIZATION);
                            await this.externalDataService.addTags(pendingSmtRe.conversationId, [
                                { color: '#8e8f67', name: '@remi.finaliza' },
                            ]);
                            await this.updateFinalizationMessageSent(pendingSmtRe.id);
                        }
                    }
                } catch (e) {
                    Sentry.captureEvent({
                        message: 'SmtReService.sendPendingSmtRe - processing individual message',
                        extra: {
                            error: e,
                            pendingSmtRe,
                        },
                    });
                }
            }
        } catch (error) {
            Sentry.captureEvent({
                message: 'SmtReService.sendPendingSmtRe - fetching pending messages',
                extra: {
                    error,
                },
            });
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
                    feature: 'remi',
                },
                conversationId: smtRe.conversationId,
            };

            // Dispatch message activity
            if (messageType === SmtReMessageType.INITIAL) {
                await this.externalDataService.updateConversationIsWithSmtRe(smtRe.conversationId);
                conversation.isWithSmtRe = !conversation.isWithSmtRe;
                await this.externalDataService.dispatchMessageActivity(conversation, activity);
            }
            if (messageType === SmtReMessageType.AUTOMATIC) {
                await this.externalDataService.dispatchMessageActivity(conversation, activity);
            }
            // Se for mensagem de finalização, enviar activity end_conversation
            if (messageType === SmtReMessageType.FINALIZATION) {
                await this.externalDataService.dispatchMessageActivity(conversation, activity);
                // Cria a categorização - try catch para impedir que o remi falhe na finalização caso de erro na criação da categorização
                try {
                    await this.finishConversation(smtRe, conversation);
                } catch (error) {
                    Sentry.captureEvent({
                        message: 'SmtReService.sendMessage - finishConversation failed',
                        extra: {
                            error,
                            smtReId,
                            conversationId: smtRe.conversationId,
                        },
                    });
                }
            }
        } catch (error) {
            Sentry.captureEvent({
                message: 'SmtReService.sendMessage - error sending message',
                extra: {
                    error,
                    smtReId: smtRe.id,
                    conversationId: smtRe.conversationId,
                    messageType,
                },
            });
        }
    }

    async stopSmtRe(conversationId: string, memberId?: string): Promise<SmtRe> {
        try {
            const smtRe = await this.findLastByConversationId(conversationId);
            if (!smtRe) return;
            if (smtRe.stopped) return smtRe;
            await this.smtReRepository.update(smtRe.id, {
                stopped: true,
                stoppedAt: moment().toDate(),
                stoppedByMemberId: memberId?.toString ? memberId?.toString?.() : memberId,
            });
            return await this.findById(smtRe.id);
        } catch (error) {
            Sentry.captureEvent({
                message: 'SmtReService.stopSmtRe - error stopping automatic messages',
                extra: {
                    error,
                    conversationId,
                    memberId,
                },
            });
        }
    }

    private async finishConversation(smtRe: SmtRe, conversation: Conversation): Promise<void> {
        try {
            // Buscar membro do sistema para usar como autor da categorização
            let sysMember = conversation.members.find((member) => member.type === IdentityType.system);
            if (!sysMember) {
                sysMember = {
                    channelId: 'system',
                    id: systemMemberId,
                    name: 'system',
                    type: IdentityType.system,
                };
            }

            // Verificar se configuração tem objetivo e desfecho definidos
            if (!smtRe.smtReSetting.objectiveId || !smtRe.smtReSetting.outcomeId) {
                await this.externalDataService.dispatchEndConversationActivity(smtRe.conversationId, sysMember, {
                    closeType: ConversationCloseType.bot_finished,
                });
                return;
            }

            // Criar categorização automática
            const categorizationData = {
                conversationId: smtRe.conversationId,
                objectiveId: smtRe.smtReSetting.objectiveId,
                outcomeId: smtRe.smtReSetting.outcomeId,

                type: 'REMI' as CategorizationType,
                userId: smtRe.smtReSetting.id, // ID da configuração especifica daquele Remi
                teamId: conversation.assignedToTeamId,
                description: 'Categorização automática via REMI',
                conversationTags: conversation.tags?.map((tag) => tag.name) || [],
            };

            await this.externalDataService.createConversationCategorization(
                conversation.workspace._id,
                smtRe.conversationId,
                sysMember.id,
                categorizationData,
                ConversationCloseType.bot_finished,
                'remi',
            );
        } catch (error) {
            Sentry.captureEvent({
                message: 'SmtReService.finishConversation - error creating automatic categorization',
                extra: {
                    error,
                    conversationId: smtRe.conversationId,
                    smtReId: smtRe.id,
                    objectiveId: smtRe.smtReSetting.objectiveId,
                    outcomeId: smtRe.smtReSetting.outcomeId,
                },
            });
            // Não faz throw do erro para não interromper o fluxo principal de finalização
        }
    }
}
