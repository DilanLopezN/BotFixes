import { User } from '../../users/interfaces/user.interface';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Activity, Identity } from '../interfaces/activity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CacheService } from './../../_core/cache/cache.service';
import { EventsService } from './../../events/events.service';
import * as Redis from 'ioredis';
import { orderBy, maxBy, minBy, isEqual } from 'lodash';
import { TeamService } from '../../team/services/team.service';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../common/utils/roles';
import { Team, TeamPermissionTypes } from '../../../modules/team/interfaces/team.interface';
import {
    ActivityType,
    ChannelIdConfig,
    ConversationStatus,
    getConversationRoomId,
    IdentityType,
    ISocketSendRequestEvent,
    IWhatswebMessageAck,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
    KissbotSocketType,
} from 'kissbot-core';
import * as crypto from 'crypto';
import { Conversation } from './../../conversation/interfaces/conversation.interface';
import { ConversationService } from './../../conversation/services/conversation.service';
import * as md5 from 'md5';
import { castObjectIdToString, tagSpamName } from './../../../common/utils/utils';
import * as moment from 'moment';
import { ConversationAttributeService } from './../../conversation-attribute-v2/services/conversation-attribute.service';
import { ActivityUtilService } from './activity-util.service';
import { ActivityReceivedType } from '../interfaces/activity-event.interface';
import { ActivitySearchService } from '../../../modules/analytics/search/activity-search/activity-search.service';
import { getAwaitingWorkingTime } from './getAwaitingWorkingTime';
import { ActivityV2Service } from '../../activity-v2/services/activity-v2.service';
import * as Sentry from '@sentry/node';
import { ConversationActivity } from 'kissbot-entities';
import { ActivityV2AckService } from '../../activity-v2/services/activity-v2-ack.service';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { ExternalDataService } from './external-data.service';
import { Exceptions } from '../../auth/exceptions';
import { AudioTranscription } from '../../context-ai/audio-transcription/models/audio-transcription.entity';

@Injectable()
export class ActivityService extends MongooseAbstractionService<Activity> {
    private ACK_EXPIRATION = 86400;
    private SPAN_LIMIT = 25;
    private DAY_SPAN_LIMIT = 250;
    private readonly logger = new Logger(ActivityService.name);
    private readonly engineIncomingMessageTopicName = 'engine_incoming_message';
    constructor(
        @InjectModel('Activity') protected readonly model: Model<Activity>,
        cacheService: CacheService,
        readonly eventsService: EventsService,
        private readonly activitySearchService: ActivitySearchService,
        private readonly teamService: TeamService,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
        private readonly conversationAttributesService: ConversationAttributeService,
        private readonly activityUtilService: ActivityUtilService,
        private readonly activityV2Service: ActivityV2Service,
        private readonly activityV2AckService: ActivityV2AckService,
        private kafkaService: KafkaService,
        private readonly externalDataService: ExternalDataService,
    ) {
        super(model, cacheService);
    }

    getSearchFilter() {}

    getEventsData() {}

    // public async processAcksOnRedis(): Promise<void> {
    //     try {
    //         let count = 0;

    //         const client = this.cacheService.getClient();
    //         client.keys('API:ACK:*', async (err, keys) => {
    //             if (err) {
    //                 console.log('error AckConsumerRedisService.processAcksOnRedis.keys', err);
    //                 return;
    //             }

    //             if (!keys.length) {
    //                 return;
    //             }

    //             for await (const key of keys) {
    //                 console.log('ack.processing', count);
    //                 count++;
    //                 const hash = key.split(':')[2];
    //                 const lastReceived = await this.geLastReceivedAck(hash, client);
    //                 const lastSaved = await this.getLastAckSaved(hash, client);

    //                 if (lastReceived > lastSaved && lastSaved > -1) {
    //                     console.log('ack.processing.key', key, lastReceived);
    //                     await this.setLastSavedAck(hash, lastReceived, client);
    //                     await this.activityV2AckService.saveAck(lastReceived, hash);
    //                 }
    //             }
    //         });
    //     } catch (error) {
    //         console.log('error AckConsumerRedisService.processAcksOnRedis', error);
    //     }
    // }

    public async getOneByHash(hash: string) {
        return await this.model.findOne({ hash });
    }

    private async isConversationSpammed(conversation: Conversation, activity: any) {
        if (
            !conversation.assignedToTeamId &&
            activity.from.type === IdentityType.user &&
            activity.text &&
            activity.text.length > 1
        ) {
            //Se tem if antes que necessita ser user pegar do from ao inves de fazer find na conversa.
            let user = activity.from;
            if (!!user && !user.disabled) {
                let count = await this.cacheService.incr(`${conversation.token}:${user.id}:${md5(activity.text)}`, 240);
                if (count > this.SPAN_LIMIT) {
                    return true;
                }

                let bot = conversation.members.find((m) => m.type === IdentityType.bot && !m.disabled);
                if (!!bot) {
                    count = await this.cacheService.incr(`${conversation.token}:${user.id}:SPAM`, 86400);
                    if (count > this.DAY_SPAN_LIMIT) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private canSendActivityToConversation(activityRequest: any, conversation: Conversation) {
        try {
            // Caso o bot esteja desabilitado e o tempo que a conversa já esta atribuida para algum time exceda o limite de 30 segundos,
            // então deve bloquear o envio desta mensagem do bot para não entrar mensagem fora de contexto.

            // Foi definido 30 segundos pois algumas mensagens do fluxo podem chegar após a transferencia, devido a fila de eventos ser
            // diferente da fila de mensagens, o que acaba acontecendo que seja consumido o evento de atribuir para o time
            // antes do evento de mensagem da conversa
            const botMember = conversation?.members?.find((member) => member.type === IdentityType.bot);
            const now = moment();
            const timeSinceAssignmentInSeconds = conversation?.metrics?.assignmentAt
                ? now.diff(moment(conversation.metrics.assignmentAt), 'seconds')
                : 0;
            // Tempo limite de envio após tranferencia da conversa para algum time
            const sendTimeLimitAfterTransfer = 30;
            if (
                botMember?.disabled &&
                timeSinceAssignmentInSeconds > sendTimeLimitAfterTransfer &&
                activityRequest.type === ActivityType.message &&
                activityRequest?.from?.type === IdentityType.bot
            ) {
                return false;
            }
            // Quando a conversa estiver fechada e for uma mensagem de bot, então deve bloquear o envio desta mensagem do bot para não entrar mensagem fora de contexto.
            if (
                activityRequest?.from?.type === IdentityType.bot &&
                conversation?.state === ConversationStatus.closed &&
                activityRequest.type === ActivityType.message
            ) {
                return false;
            }

            return true;
        } catch (error) {
            Sentry.captureEvent({
                message: 'ERROR canSendActivityToConversation',
                extra: {
                    error: error,
                    activity: activityRequest,
                    conversation,
                },
            });
            return true;
        }
    }

    public async handleActivity(
        activityRequest: any,
        conversationId: string,
        conversation?: Conversation,
        useActivityHash?: boolean,
    ) {
        if (conversationId && !conversation) {
            conversation = await this.conversationService.findOne({ _id: conversationId });
        }

        if (!conversation) {
            throw new BadRequestException('Conversation not found');
        }

        const canSend = this.canSendActivityToConversation(activityRequest, conversation);

        if (!canSend) {
            return;
        }

        const isSpammed = await this.isConversationSpammed(conversation, activityRequest);
        if (isSpammed) {
            const hasTagSpam = conversation.tags.find((tag) => tag.name === tagSpamName);
            if (!hasTagSpam) {
                await this.conversationService.createTag(
                    conversation.workspace._id,
                    castObjectIdToString(conversation._id),
                    {
                        color: '#f12727',
                        name: tagSpamName,
                    },
                );
            }
            const botMember = conversation.members.find(
                (member) => member.type === IdentityType.bot && !member.disabled,
            );
            if (botMember) {
                await this.conversationService.disableBot(castObjectIdToString(conversation._id));
            }
            console.log('spammed conversation', conversation._id);
            return;
        }

        let activity: Activity = await this.activityUtilService.getCompleteActivityObject(
            activityRequest,
            (conversation.toJSON?.({ minimize: false }) ?? conversation) as Conversation,
        );

        if (!activityRequest.timestamp) {
            activity.timestamp = moment().valueOf();
        } else {
            activity.timestamp = moment(activityRequest.timestamp).valueOf();
        }

        try {
            activity.id = activity._id;

            // useActivityHash = Mantem hash na activity de entrada, pois esse hash é usado para envio de reação ou para responder a uma msg
            if (!useActivityHash) {
                // nas activitys de saida o hash vai continuar sendo o id da msg
                activity.hash = activity._id.toString();
            }
            /*
            if (!activityRequest.hash) {
                activityRequest.hash = crypto.randomBytes(10).toString('hex').toUpperCase();
            }*/

            // só vai processar se a activity vir de um bot e tiver um atacchment, não atrapalha o fluxo das outras activity
            if (activity.from.type === 'bot' && activity?.attachmentFile) {
                try {
                    const newActivity = await this.conversationService.processMediaForBot(activity, conversation);
                    activity = newActivity;
                } catch (error) {
                    this.logger.error('Failed to process medias in bot', error);
                }
            }

            await this.dispatchActivity(activity, conversation);
            await this.setConversationIdByActivityHash(activity.hash, castObjectIdToString(conversation._id));

            if (activity.type !== ActivityType.typing) {
                if (typeof activity.ack != 'number') {
                    activity.ack = 0;
                }
                const clearedActivity = await this.clearActivityBeforeSave(activity);

                try {
                    let data = null;
                    if (!!clearedActivity.data && Object.keys(clearedActivity.data).length > 0) {
                        data = clearedActivity.data;
                    }
                    await this.activityV2Service.createActivity({
                        _id: clearedActivity._id.toString(),
                        ack: clearedActivity.ack,
                        conversationId: clearedActivity.conversationId.toString
                            ? clearedActivity.conversationId.toString()
                            : clearedActivity.conversationId,
                        createdAt: new Date(clearedActivity.timestamp),
                        fromChannel: clearedActivity.from.channelId,
                        fromId: clearedActivity.from.id,
                        fromName: clearedActivity.from.name,
                        fromType: clearedActivity.from.type,
                        hash: clearedActivity.hash,
                        isHsm: clearedActivity.isHsm,
                        name: clearedActivity.name,
                        timestamp: clearedActivity.timestamp,
                        type: clearedActivity.type,
                        workspaceId: clearedActivity.workspaceId,
                        attachmentFile: clearedActivity.attachmentFile,
                        attachments: clearedActivity.attachments,
                        recognizerResult: (clearedActivity as any).recognizerResult,
                        text: clearedActivity.text,
                        quoted: clearedActivity.quoted,
                        templateId: clearedActivity.templateId,
                        referralSourceId: clearedActivity.referralSourceId,
                        data,
                    });
                } catch (e) {
                    let errorJson = '';
                    try {
                        errorJson = JSON.stringify(e);
                    } catch (e) {}
                    Sentry.captureEvent({
                        message: 'ERROR SAVING ACTIVITY TO POSTGRES',
                        extra: {
                            errorJson,
                            activity: clearedActivity,
                        },
                    });
                    this.logger.error(`ERROR SAVING ACTIVITY TO POSTGRES: ${JSON.stringify(e)}`);
                }
            }

            return activity;
        } catch (e) {
            console.log('handleActivity', e);
        }
    }

    async dispatchActivity(activity: Activity, conversation: Conversation) {
        const conversationAttributes = await this.conversationAttributesService.getConversationAttributes(
            castObjectIdToString(conversation.workspace._id),
            castObjectIdToString(conversation._id),
        );

        try {
            if (conversation?.smtReId && activity?.from?.type === IdentityType.user) {
                await this.conversationService.stopSmtRe(
                    castObjectIdToString(conversation?._id),
                    conversation?.workspace?._id,
                    activity?.from?.id,
                );
                conversation = await this.conversationService.findOne({ _id: conversation._id });
            }
            if (
                conversation?.stoppedSmtReId &&
                !conversation?.smtReId &&
                activity?.from?.type === IdentityType.agent &&
                activity.type == ActivityType.message
            ) {
                await this.conversationService.recreateSmtRe(
                    castObjectIdToString(conversation?._id),
                    conversation?.workspace?._id,
                    activity?.from?.id,
                );
            }
        } catch (e) {
            Sentry.captureEvent({
                message: 'ERROR dispatchActivity smtReId',
                extra: {
                    error: e,
                    activity,
                    conversation,
                },
            });
        }

        // Existem vários métodos que alteram o objeto conversation quando uma activity é enviada.
        // Precisamos agrupar todas as alteracoes do objeto conversation em uma só e fazer o update do objeto apenas uma vez.
        // Para fazer isso cada método que altera conversation deve retornar um objeto apenas com os atributos que devem ser alterados.

        // Usar uma mesma data para todos os campos que forem fazer update usando now. Para os campos nao ficarem com milisegundos diferentes.
        const now = activity.timestamp ? +new Date(activity.timestamp) : +new Date();
        const updateConversationQuery: Conversation = { metrics: {} } as any;

        if (activity.type !== ActivityType.suspend_conversation && conversation.suspendedUntil > moment().valueOf()) {
            updateConversationQuery.suspendedUntil = 0;
            conversation.suspendedUntil = 0;
        }

        if (activity.type == ActivityType.message || activity.type === ActivityType.member_upload_attachment) {
            //Evitar fazer find toda hora de membros.
            let botMember = null;
            if (activity.from.type == IdentityType.bot) {
                botMember = activity.from;
            } else {
                botMember = conversation.members.find((member) => member.type === IdentityType.bot);
            }

            if (activity.from.type == IdentityType.agent) {
                //Se é a primeira mensagem do agente salva o momento que enviou a primeira mensagem
                if (!conversation.metrics?.firstAgentReplyAt) {
                    updateConversationQuery.metrics.firstAgentReplyAt = now;
                }
                // Se a ultima mensage for do Usuario conversation.waitingSince > 0.
                if (conversation.waitingSince) {
                    // Agente enviou a primeira mensagem para o usuário.
                    if (!conversation.metrics?.timeToAgentReply) {
                        updateConversationQuery.metrics.timeToAgentReply = now - conversation.waitingSince;
                        try {
                            if (!conversation.metrics?.awaitingWorkingTime) {
                                if (conversation.assignedToTeamId) {
                                    const team = await this.teamService.getOne(conversation.assignedToTeamId);
                                    if (team) {
                                        if (conversation.metrics?.assignmentAt) {
                                            updateConversationQuery.metrics.awaitingWorkingTime =
                                                await getAwaitingWorkingTime(
                                                    conversation.metrics?.assignmentAt,
                                                    now,
                                                    team,
                                                );
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            this.logger.debug('ActivityService.dispatchActivity::awaitingWorkingTime', e);
                            this.logger.debug(e);
                            this.logger.debug(`conversation.assignedToTeamId: ${conversation.assignedToTeamId}`);
                            this.logger.debug(`conversation._id: ${conversation._id}`);
                        }
                    }

                    // Tempo médio de resposta do agente. (tempo medio + tempo de espera) / 2
                    if (conversation.metrics?.medianTimeToAgentReply) {
                        updateConversationQuery.metrics.medianTimeToAgentReply =
                            (conversation.metrics?.medianTimeToAgentReply + (now - conversation.waitingSince)) / 2;
                    } else {
                        updateConversationQuery.metrics.medianTimeToAgentReply = now - conversation.waitingSince;
                    }
                }

                // Agente enviou uma mensagem e o usuário não está mais aguardando. Zera tempo de espera.
                updateConversationQuery.waitingSince = 0;
                updateConversationQuery.order = this.activityUtilService.getOrder(
                    conversation.priority,
                    9000000000000,
                    now,
                );

                // Altera ultima data de mensagem enviada pelo agente.
                updateConversationQuery.metrics.lastAgentReplyAt = now;
            } else if (activity.from.type == IdentityType.user && (!botMember || botMember.disabled == true)) {
                if (!conversation.metrics?.timeToUserReply && conversation.metrics?.lastAgentReplyAt) {
                    // Agente criou a conversa e mandou mensagem para o usuario. Tempo que o usuário leva para responser a primeira mensagem
                    updateConversationQuery.metrics.timeToUserReply = now - conversation.metrics?.lastAgentReplyAt;
                }

                // Se ultima mensagem for do agente. Calcula tempo médio de resposta do usuario
                if (!conversation.waitingSince) {
                    // Tempo médio de resposta do Usuario
                    if (conversation.metrics?.lastAgentReplyAt) {
                        if (conversation.metrics?.medianTimeToUserReply) {
                            updateConversationQuery.metrics.medianTimeToUserReply =
                                (conversation.metrics?.medianTimeToUserReply +
                                    (now - conversation.metrics?.lastAgentReplyAt)) /
                                2;
                        } else {
                            updateConversationQuery.metrics.medianTimeToUserReply =
                                now - conversation.metrics?.lastAgentReplyAt;
                        }
                    }

                    // Usuário mandou mensagem para o agente. Comeca a contar o tempo a partir da primeira mensagem que o usuario mandou
                    updateConversationQuery.waitingSince = now;
                    const agentMember = conversation.members.find(
                        (member) => member.type === IdentityType.agent && member.disabled == false,
                    );
                    if (agentMember) {
                        updateConversationQuery.order = this.activityUtilService.getOrder(
                            conversation.priority,
                            0,
                            now,
                        );
                    } else {
                        updateConversationQuery.order = this.activityUtilService.getOrder(
                            conversation.priority,
                            9000000000000,
                            conversation.metrics?.assignmentAt || now,
                        );
                    }
                    //updateConversationQuery.order = this.activityUtilService.getOrder(conversation.priority, 0, now);
                } else if (conversation.waitingSince == 0) {
                    // Usuário mandou mensagem para o agente. Comeca a contar o tempo a partir da primeira mensagem que o usuario mandou
                    updateConversationQuery.waitingSince = now;
                    const agentMember = conversation.members.find(
                        (member) => member.type === IdentityType.agent && member.disabled == false,
                    );
                    if (agentMember) {
                        updateConversationQuery.order = this.activityUtilService.getOrder(
                            conversation.priority,
                            0,
                            now,
                        );
                    } else {
                        updateConversationQuery.order = this.activityUtilService.getOrder(
                            conversation.priority,
                            9000000000000,
                            conversation.metrics?.assignmentAt || now,
                        );
                    }
                    //updateConversationQuery.order = this.activityUtilService.getOrder(conversation.priority, 0, now);
                }

                // Altera a data de ultima mensagem enviada pelo agente.
                updateConversationQuery.metrics.lastUserReplyAt = now;
            }
        } else if (activity.type == ActivityType.member_added) {
            // Agente entou na conversa.
            if (activity.from.type == IdentityType.agent) {
                if (!conversation.metrics?.assignmentAt) {
                    // Agente assumiu a conversa sem que ela fosse transferida.
                    updateConversationQuery.metrics.assignmentAt = now;

                    // Usuario nao estava aguardando ser atendido. Tempo de espera 0 e tempo para Assignment 0
                    updateConversationQuery.metrics.timeToAssignment = 0;
                    updateConversationQuery.waitingSince = 0;
                    updateConversationQuery.order = this.activityUtilService.getOrder(
                        conversation.priority,
                        9000000000000,
                        now,
                    );
                } else {
                    // Agente assumiu a conversa depois dela ser transferida. Mas ainda nao respondeu o paciente.
                    if (conversation.waitingSince) {
                        // Agente entrou na conversa e o usuario estava aguardando resposta
                        updateConversationQuery.metrics.timeToAssignment = now - conversation.waitingSince;
                    } else {
                        updateConversationQuery.metrics.timeToAssignment = 0;
                    }
                }
            } else if (
                activity.from.type == IdentityType.channel &&
                activity.from.channelId == ChannelIdConfig.liveagent
            ) {
                // Conversa foi transferida para atendimento e o usuario comeca a aguardar nesse momento.
                // Quando a conversa foi assumida por um agente.
                updateConversationQuery.metrics.assignmentAt = now;
                updateConversationQuery.waitingSince = now;
                updateConversationQuery.order = this.activityUtilService.getOrder(
                    conversation.priority,
                    9000000000000,
                    now,
                );
            }
        } else if (activity.type == ActivityType.assigned_to_team) {
            if (conversation.assignedToTeamId && !conversation.metrics?.assignmentAt) {
                updateConversationQuery.metrics.assignmentAt = now;
                updateConversationQuery.waitingSince = now;

                if (conversation?.createdByChannel === ChannelIdConfig.campaign) {
                    updateConversationQuery.waitingSince = 0;
                }

                if (!updateConversationQuery.metrics?.automaticDurationAttendance) {
                    updateConversationQuery.metrics.automaticDurationAttendance =
                        now - moment(conversation.createdAt).valueOf();
                }
                updateConversationQuery.order = this.activityUtilService.getOrder(
                    conversation.priority,
                    9000000000000,
                    now,
                );
            }
        } else if (activity.type == ActivityType.member_exit) {
            const agentMember = conversation.members.find(
                (member) => member.type === IdentityType.agent && member.disabled == false,
            );
            if (!agentMember && conversation.metrics?.assignmentAt) {
                updateConversationQuery.order = this.activityUtilService.getOrder(
                    conversation.priority,
                    9000000000000,
                    conversation.metrics?.assignmentAt,
                );
            }
        } else if (activity.type == ActivityType.end_conversation) {
            // Conversa foi finalizada e estava sendo atendida por um agente.
            if (conversation.metrics?.assignmentAt) {
                updateConversationQuery.metrics.timeToClose = now - conversation.metrics?.assignmentAt;
            }
            updateConversationQuery.waitingSince = 0;
            updateConversationQuery.order = this.activityUtilService.getOrder(
                conversation.priority,
                9000000000000,
                now,
            );
            updateConversationQuery.metrics.closeAt = now;
            updateConversationQuery.state = ConversationStatus.closed;
            updateConversationQuery.expiresAt = 0;
            updateConversationQuery.beforeExpiresAt = 0;
            updateConversationQuery.expirationTime = 0;
            updateConversationQuery.beforeExpirationTime = 0;
            updateConversationQuery.closedBy = activity.from.id;

            if (activity.from.type == 'bot' && !conversation.metrics?.automaticDurationAttendance) {
                updateConversationQuery.metrics.automaticDurationAttendance =
                    now - moment(conversation.createdAt).valueOf();
            }
        }

        // Altera o tempo de expiracao de conversa de acordo com o usuário e o tipo de activity que enviou a mensagem
        try {
            await this.activityUtilService.updateExpiresAt(activity, conversation, updateConversationQuery, now);
        } catch (e) {
            console.error('erro ignorado ao atualizar updateExpiresAt', updateConversationQuery);
        }

        let conversationJson = conversation.toJSON ? conversation.toJSON({ minimize: false }) : conversation;
        conversationJson = {
            ...conversationJson,
            ...updateConversationQuery,
        };

        // Objeto alterado deve ser populado com os campos novos nao nulos. Campos nulos nao sao alterados.
        const updateQuery = this.activityUtilService.buildUpdateQuery(conversationJson, updateConversationQuery);

        let updateConversationPromise = null;

        if (process.env.NODE_ENV != 'production') {
            //    console.log('updateQuery', JSON.stringify(updateQuery));
        }

        if (updateQuery) {
            updateConversationPromise = this.conversationService.updateRaw({ _id: conversation._id }, updateQuery);
        }

        const promisesArr: Array<Promise<any>> = [];

        if (activity?.to?.avatar && activity?.to?.avatar?.length > 250) {
            activity.to.avatar = '';
        }

        if (activity.type === ActivityType.comment) {
            activity.to = activity.from;

            promisesArr.push(
                this.eventsService.sendActivityEvent(
                    {
                        conversation: {
                            ...conversationJson,
                            attributes: conversationAttributes ? conversationAttributes.data : [],
                        },
                        activity,
                        type: ActivityReceivedType.activityReceived,
                    },
                    activity.to.channelId,
                ),
            );
        } else {
            const channelConfig = await this.externalDataService.getChannelConfig(conversation.token);
            conversation.members
                ?.filter((member) => member.id !== activity.from.id && !member.disabled)
                ?.forEach((member) => {
                    activity.to = member as Identity;
                    let activityData = {
                        conversation: {
                            ...conversationJson,
                            attributes: conversationAttributes ? conversationAttributes.data : [],
                        },
                        activity,
                        type: ActivityReceivedType.activityReceived,
                    };
                    if (activity.to.channelId === 'kissbot') {
                        promisesArr.push(
                            this.kafkaService.sendEvent(
                                activityData,
                                conversation.workspace._id,
                                this.engineIncomingMessageTopicName,
                            ),
                        );
                    } else {
                        if (channelConfig?.whatsappProvider && activity?.to?.channelId == ChannelIdConfig.gupshup) {
                            promisesArr.push(
                                this.eventsService.sendActivityEvent(activityData, ChannelIdConfig.gupshup + '-v2'),
                            );
                        } else {
                            promisesArr.push(this.eventsService.sendActivityEvent(activityData, activity.to.channelId));
                        }
                    }
                });
        }

        promisesArr.push(
            this.eventsService.sendEvent({
                data: {
                    activity: {
                        ...activity,
                        to: undefined,
                    },
                    conversation: {
                        ...conversationJson,
                        attributes: conversationAttributes ? conversationAttributes.data : [],
                    },
                },
                dataType: KissbotEventDataType.ACTIVITY,
                source: KissbotEventSource.CONVERSATION_MANAGER,
                type: KissbotEventType.ACTIVITY_SENDED,
            }),
        );

        if (!activity?.data?.omitSocket) {
            if (activity.type !== ActivityType.rating_message) {
                const rooms = getConversationRoomId(conversation);
                if (conversation.bot?._id) {
                    rooms.push(conversation.bot._id);
                }
                const socketEvent = {
                    data: {
                        message: {
                            activity: {
                                ...activity,
                                to: undefined,
                                conversationHash: conversation.hash,
                                socket: true,
                            },
                            conversation: {
                                ...conversationJson,
                                attributes: conversationAttributes ? conversationAttributes.data : [],
                            },
                        },
                        type: KissbotSocketType.ACTIVITY,
                    },
                    room: rooms,
                };

                promisesArr.push(
                    this.eventsService.sendEvent({
                        data: socketEvent,
                        dataType: KissbotEventDataType.SOCKET,
                        source: KissbotEventSource.KISSBOT_API,
                        type: KissbotEventType.SOCKET_SEND_REQUEST,
                    }),
                );
            }
        }

        try {
            if (!isEqual(conversation.metrics || {}, conversationJson.metrics)) {
                const client = this.cacheService.getClient();
                client.setnx('METRICS:NOTEQUALS', 1);
                client.incr('METRICS:NOTEQUALS');
            } else {
                const client = this.cacheService.getClient();
                client.setnx('METRICS:EQUALS', 1);
                client.incr('METRICS:EQUALS');
            }
        } catch (ex) {}

        try {
            if (!isEqual(conversation.metrics || {}, conversationJson.metrics)) {
                promisesArr.push(
                    this.eventsService.sendEvent({
                        data: conversationJson,
                        dataType: KissbotEventDataType.CONVERSATION,
                        source: KissbotEventSource.CONVERSATION_MANAGER,
                        type: KissbotEventType.CONVERSATION_METRICS_UPDATED,
                    }),
                );
            }
        } catch (ex) {
            Sentry.captureException(ex);
            promisesArr.push(
                this.eventsService.sendEvent({
                    data: conversationJson,
                    dataType: KissbotEventDataType.CONVERSATION,
                    source: KissbotEventSource.CONVERSATION_MANAGER,
                    type: KissbotEventType.CONVERSATION_METRICS_UPDATED,
                }),
            );
        }

        await Promise.all([...promisesArr, updateConversationPromise]);

        if (activity.type == ActivityType.end_conversation) {
            const conversationClosed = await this.conversationService.findOne({ _id: conversation._id });
            let team = null;
            const workspace = await this.externalDataService.getWorkspaceById(conversation.workspace._id);
            if (conversation.assignedToTeamId) {
                team = await this.teamService.getOne(conversation.assignedToTeamId);
            }
            this.eventsService.sendEvent({
                data: {
                    ...(conversationClosed?.toJSON
                        ? conversationClosed.toJSON({ minimize: false })
                        : conversationClosed),
                    closeType: activity?.data?.closeType,
                    team,
                    ignoreUserFollowupConversation: workspace?.generalConfigs?.ignoreUserFollowupConversation,
                },
                dataType: KissbotEventDataType.CONVERSATION,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.CONVERSATION_CLOSED,
            });
            try {
                const client = await this.cacheService.getClient();
                const conversationActivitiesCacheKey = this.getCacheKeyFromConversationId(
                    castObjectIdToString(conversation._id),
                );
                client.expire(conversationActivitiesCacheKey, 60 * 2);
            } catch (e) {
                console.log('Cannot clear cache activity on close', e);
            }
        }
    }

    private async getAwaitingWorkingTime(assignedAt: number, assumedAt: number, team: Team): Promise<number> {
        return 0;
    }

    async _create(activity): Promise<Activity> {
        if (activity.id) {
            activity._id = activity.id;
        }
        const activityToCreate = new this.model(activity);
        const createdActivity = await this.model.create(activityToCreate);
        await this.setActivityToHashSetOnRedis(createdActivity, false);

        return createdActivity;
    }

    async getActivitiesHashesByConversationIdAndWatermark(
        conversationId: string,
        watermark: number,
    ): Promise<{ hash: string }[]> {
        return (await this.model.find(
            {
                conversationId,
                timestamp: { $lte: watermark },
                'from.channelId': { $in: [ChannelIdConfig.kissbot, ChannelIdConfig.liveagent] },
                $or: [{ type: ActivityType.message }, { type: ActivityType.member_upload_attachment }],
            },
            { hash: 1 },
        )) as any;
    }

    private async clearActivityBeforeSave(activity: Activity): Promise<Activity> {
        if (activity.attachments?.length === 0) {
            delete activity.attachments;
        }
        if (activity.attachments?.length > 0) {
            delete activity.text;
            for (const attach of activity.attachments) {
                if (attach.content?.images?.length === 0) {
                    delete attach.content?.images;
                }
                if (attach.content?.buttons?.length === 0) {
                    delete attach.content?.buttons;
                }
            }
        }
        if (!!activity.id) {
            delete activity.id;
        }
        if (activity.from?.avatar === null || activity.from?.avatar === '') {
            delete activity.from?.avatar;
        }
        return activity;
    }

    private async setActivityToHashSetOnRedis(activity, forceCreate = false) {
        const client = this.cacheService.getClient();

        if (client) {
            const conversationActivitiesCacheKey = this.getCacheKeyFromConversationId(activity.conversationId);

            //Seta apenas se já existir no cache, deixa responsável pelo get colocar no cache as demais.
            const exists = await client.exists(conversationActivitiesCacheKey);
            if (exists || forceCreate) {
                await client.hset(conversationActivitiesCacheKey, activity.hash, JSON.stringify(activity));
                await client.expire(conversationActivitiesCacheKey, this.ACK_EXPIRATION);
            }
        }
    }

    public async _queryPaginate(_query: any, _: User, workspaceId: string) {
        const query = {
            ..._query,
            filter: {
                ...(_query.filter || {}),
                workspaceId,
            },
        };

        const { filter, skip, limit, sort, projection } = query;

        const data = await this.model.find(filter).skip(skip).limit(limit).sort(sort).select(projection);

        const currentPage = skip / limit + 1;

        return {
            count: null,
            currentPage,
            nextPage: currentPage + 1,
            data,
        };
    }

    private getActivityAckCacheKey(hash, ack?: any | undefined) {
        return `ACK:${hash}`;
    }

    private getActivityLastSavedAckCacheKey(hash) {
        return `SAVED_ACK:${hash}`;
    }

    private getCacheKeyFromConversationId(conversationId: string): string {
        return `ACTIVITIES:${conversationId}`;
    }

    // async updateActivityAck(ev: IWhatswebMessageAck) {
    //     const client = this.cacheService.getClient();
    //     const promises = ev.hash.map(async (hash) => {
    //         const lastReceived = await this.geLastReceivedAck(hash, client);
    //         const lastSaved = await this.getLastAckSaved(hash, client);

    //         let nextAck = ev.ack;

    //         if (lastSaved < 0) {
    //             return;
    //         }

    //         if (nextAck > -1 && nextAck <= lastReceived) {
    //             nextAck = lastReceived;
    //         }

    //         if (lastSaved != null && lastSaved >= nextAck) {
    //             return;
    //         }

    //         const updateClause: any = { hash };

    //         if (nextAck >= 0) {
    //             updateClause.ack = { $lt: nextAck };
    //         }

    //         await this.setLastSavedAck(hash, nextAck, client);
    //         await this.model.updateOne(updateClause, { $set: { ack: nextAck } });
    //     });

    //     await Promise.all(promises).catch((erro) => {
    //         this.logger.error(`Error updateActivityAck ${JSON.stringify(erro)}`);
    //     });
    // }

    // private async saveActivityAck(ev: IWhatswebMessageAck) {
    //     //TODO: SERÁ QUE EM TODAS AS CONVERSAS O ACK DEVE SER ENVIADO PARA SOCKET????
    //     //QUANTO TIVER APENAS O BOT E O USUARIO???
    //     this.sendAckToSocket(ev);
    //     const client = this.cacheService.getClient();
    //     const promises = ev.hash.map(async (hash) => {
    //         await this.setLastReceivedAck(hash, ev.ack, client);
    //     });
    //     await Promise.all(promises).catch((e) => {
    //         console.log('saveActivityAck', e);
    //     });
    // }

    async sendAckToSocket(ev: IWhatswebMessageAck) {
        const { hash } = ev;
        for (const hashItem of hash) {
            if (!!hashItem) {
                //TODO: será que todos os acks precisam ser enviados para o socket?
                const conversationId = await this.getConversationIdByActivityHash(hashItem);
                let conversation = ev?.['conversation'];
                if (!conversation) {
                    conversation = await this.conversationService.getOne(conversationId);
                }

                // TODO, VERIFICAR SE NÃO DA PARA REMOVER DO REDIS O HADH
                // DA ACTIVITY X CONVID SE ACK = 3
                if (!conversation) {
                    return;
                }
                const rooms = getConversationRoomId(conversation);
                const socketEvent: ISocketSendRequestEvent = {
                    data: {
                        message: {
                            ...ev,
                            conversationId,
                        },
                        type: KissbotSocketType.ACTIVITY_ACK,
                    },
                    room: rooms,
                };
                this.eventsService.sendEvent({
                    data: socketEvent,
                    dataType: KissbotEventDataType.ANY,
                    source: KissbotEventSource.KISSBOT_API,
                    type: KissbotEventType.SOCKET_SEND_REQUEST,
                });
            }
        }
    }

    async setConversationIdByActivityHash(hash: string, conversationId: string) {
        const client = await this.cacheService.getClient();
        const key = this.getActivityHashConversationIdCacheKey(hash);
        await client.set(key, conversationId, 'EX', 43200);
    }

    async getConversationIdByActivityHash(hash: string): Promise<string> {
        const client = await this.cacheService.getClient();
        const key = this.getActivityHashConversationIdCacheKey(hash);
        return await client.get(key);
    }

    getActivityHashConversationIdCacheKey(hash) {
        return `ACTIVITY_CID:${hash}`;
    }

    // private async setLastSavedAck(hash, ack, client) {
    //     const key = this.getActivityLastSavedAckCacheKey(hash);
    //     if (ack < 0) {
    //         await client.zadd(key, ack * -1000, ack);
    //     } else {
    //         await client.zadd(key, ack, ack);
    //     }
    //     //await client.expire(key, 86400);
    //     await client.expire(key, this.ACK_EXPIRATION);
    // }

    // private async setLastReceivedAck(hash, ack, client) {
    //     const key = this.getActivityAckCacheKey(hash, ack);
    //     if (ack < 0) {
    //         await client.zadd(key, ack * -1000, ack);
    //     } else {
    //         await client.zadd(key, ack, ack);
    //     }
    //     //await client.expire(key, 86400);
    //     await client.expire(key, this.ACK_EXPIRATION * 3);
    // }

    // async getConversationActivities(conversationId: string, allActivities: boolean = false) {
    //     const cacheKey = this.getCacheKeyFromConversationId(conversationId);
    //     const client = this.cacheService.getClient();
    //     const activitiesResult = await client.hvals(cacheKey);
    //     if (activitiesResult.length > 0) {
    //         const activities = activitiesResult.map((stringActivity) => JSON.parse(stringActivity));
    //         return this.getAllActivitiesWithAcks(activities, allActivities);
    //     }

    //     const activities = await this.getModel()
    //         .find({ conversationId })
    //         //.limit(allActivities ? 10000 : 15)
    //         .exec();

    //     activities.map((ac) => {
    //         this.setActivityToHashSetOnRedis(ac, true);
    //     });
    //     return this.getAllActivitiesWithAcks(activities, allActivities);
    // }

    async getConversationActivitiesPostgres(conversationId: string, workspaceId: string) {
        const activities = await this.activityV2Service.getAcitvitiesByConversationId(
            conversationId.toString ? conversationId.toString() : conversationId,
            workspaceId.toString ? workspaceId.toString() : workspaceId,
        );
        const client = this.cacheService.getClient();

        //TODO: MELHORAR ESSE METODO, ESTA FAZENDO DOIS LOOPINGS
        let result = [];

        for (const activity of activities) {
            let ack = activity.subAck || 0;
            // Precisa disso pois antes da migração o ack está no campo ack da activity_child_{WORKSPACE_ID} e depois da migração
            // está no campo gerado pela subquery docampo subAck
            if (ack == 0 && activity.ack) {
                ack = activity.ack;
            }

            // if (ack == 0) {
            //     ack = minBy(activity.acks, 'ack')?.ack || 0;
            // }

            // if (ack == 0) {
            //     ack = maxBy(activity.acks, 'ack')?.ack || 0;
            // }

            // if (ack == 0) {
            //     // ack = parseInt(await this.getActivityAckFromRedis(activity.hash, activity.ack, client));
            // }

            activity.ack = parseInt(String(ack || 0));

            // delete activity.acks;
            result.push(await this.transformNewActivityToOldActivity(activity as ConversationActivity));
        }

        return result;
    }

    private async transformNewActivityToOldActivity(activity: ConversationActivity) {
        return {
            ack: activity.ack,
            attachmentFile: activity.attachmentFile,
            attachments: activity.attachments,
            conversationId: activity.conversationId,
            createdAt: activity.createdAt,
            data: activity.data,
            hash: activity.hash,
            isHsm: activity.isHsm,
            templateId: activity.templateId,
            name: activity.name,
            text: activity.text,
            quoted: activity.quoted,
            timestamp: Number(activity.timestamp),
            type: activity.type,
            workspaceId: activity.workspaceId,
            recognizerResult: activity.recognizerResult,
            _id: activity.id,
            from: {
                channelId: activity.fromChannel,
                id: activity.fromId,
                name: activity.fromName,
                type: activity.fromType,
            },
            referralSourceId: activity.referralSourceId,
        };
    }

    // private async getAllActivitiesWithAcks(activities: Activity[], allActivities: boolean) {
    //     const client = this.cacheService.getClient();

    //     let activitiesWithAcks: Partial<Activity>[];
    //     if (allActivities) {
    //         activitiesWithAcks = await Promise.all(
    //             activities.map(async (ac) => {
    //                 const ack = await this.getActivityAckFromRedis(ac.hash, ac.ack, client);
    //                 return {
    //                     ...((ac.toJSON ? ac.toJSON({ minimize: false }) : ac) as Partial<Activity>),
    //                     ack,
    //                 };
    //             }),
    //         );
    //     } else {
    //         activitiesWithAcks = await Promise.all(
    //             activities
    //                 .filter((actitivty) => {
    //                     return (
    //                         actitivty.type == ActivityType.message ||
    //                         actitivty.type == ActivityType.member_upload_attachment ||
    //                         actitivty.type == ActivityType.member_added ||
    //                         (actitivty.type == ActivityType.event && actitivty.name == 'start')
    //                     );
    //                 })
    //                 .map(async (ac) => {
    //                     const ack = await this.getActivityAckFromRedis(ac.hash, ac.ack, client);
    //                     return {
    //                         ...((ac.toJSON ? ac.toJSON({ minimize: false }) : ac) as Partial<Activity>),
    //                         ack,
    //                     };
    //                 }),
    //         );
    //     }
    //     return orderBy(activitiesWithAcks, 'timestamp', 'desc');
    // }

    // private async getActivityAckFromRedis(hash: string, activityAck, client: Redis.Redis) {
    //     //se for erro ou lida retorna
    //     if (activityAck < 0 || activityAck >= 3) {
    //         return activityAck;
    //     }

    //     const lastReceived = await this.geLastReceivedAck(hash, client);

    //     if (lastReceived != null) {
    //         return lastReceived;
    //     } else {
    //         return activityAck;
    //     }
    // }

    // private async geLastReceivedAck(hash: string, client: Redis.Redis): Promise<number> {
    //     const key = this.getActivityAckCacheKey(hash);

    //     //alterando para usar zadd
    //     //const values = await client.zrange(key, -1, -1)
    //     const values = await client.zrevrangebyscore(key, '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, 1);

    //     if (values.length > 0) {
    //         return parseInt(values[0]);
    //     }

    //     return null;
    // }

    // private async getLastAckSaved(hash: string, client: Redis.Redis): Promise<number> {
    //     const key = this.getActivityLastSavedAckCacheKey(hash);

    //     const values = await client.zrevrangebyscore(key, '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, 1);

    //     if (values.length > 0) {
    //         return parseInt(values[0]);
    //     }

    //     return null;
    // }

    public async searchActivities(user: User, workspaceId: string, q: string, limit: number, skip: number) {
        const isAnyAdmin = isAnySystemAdmin(user);
        const userIsWorkspaceAdmin = isWorkspaceAdmin(user, workspaceId);

        let matchedIds: any = [];

        if (!isAnyAdmin && !userIsWorkspaceAdmin) {
            const teamsWithPermission = await this.teamService.getUserTeamPermissions(
                workspaceId,
                castObjectIdToString(user._id),
                TeamPermissionTypes.canViewOpenTeamConversations,
            );

            const teamsCanViewHistoricConversation = await this.teamService.getUserTeamPermissions(
                workspaceId,
                castObjectIdToString(user._id),
                TeamPermissionTypes.canViewHistoricConversation,
            );

            const teamIds = [...(teamsWithPermission || [])].map((team) => castObjectIdToString(team._id));
            const historicConversationTeams = [...(teamsCanViewHistoricConversation || [])].map((team) =>
                castObjectIdToString(team._id),
            );

            matchedIds = await this.activitySearchService.searchActivitiesByTeams(
                q,
                workspaceId,
                teamIds,
                limit,
                skip,
                historicConversationTeams,
            );
        } else {
            matchedIds = await this.activitySearchService.searchActivities(q, workspaceId, limit, skip);
        }

        if (!matchedIds?.length) {
            return [];
        }

        try {
            const activities = await this.activityV2Service.getActivitiesByIdList(matchedIds);
            if (!Array.isArray(activities)) {
                return [];
            }

            const oldActivities = [];
            for (let activity of activities) {
                oldActivities.push(await this.transformNewActivityToOldActivity(activity));
            }
            return oldActivities;
        } catch (e) {
            this.logger.error(e);
            return [];
        }
    }

    async getConversationActivitiesByTypes(conversationId: string, workspaceId: string, types: ActivityType[]) {
        try {
            const activities = await this.activityV2Service.getAcitvitiesByConversationId(conversationId, workspaceId);
            let result = [];

            for (const activity of activities) {
                if (types.includes(activity.type)) {
                    result.push(await this.transformNewActivityToOldActivity(activity as ConversationActivity));
                }
            }
            return result;
        } catch (e) {
            console.log('ActivityService.getConversationActivitiesByTypes', e);
        }
    }

    async existsActivityByHash(hash: string): Promise<boolean> {
        const conversationId = await this.getConversationIdByActivityHash(hash);
        if (conversationId) {
            return true;
        }
        const existingAcitivity = await this.model.findOne({ hash });
        if (!!existingAcitivity) {
            return true;
        }
        //
        return false;
    }

    async transformActivityWithAudioTranscription(
        workspaceId: string,
        activityId: string,
        userId: string,
    ): Promise<AudioTranscription> {
        const existingAcitivity = await this.activityV2Service.getActivitiesById(workspaceId, activityId);
        if (!existingAcitivity) {
            throw Exceptions.ACTIVITY_NOT_FOUND;
        }

        if (!existingAcitivity?.attachmentFile?.contentUrl || existingAcitivity.fromType !== IdentityType.user) {
            throw Exceptions.INVALID_ACTIVITY_AUDIO_TRANSCRIPTION;
        }

        const existingAudioTranscription = await this.externalDataService.getAudioTranscriptionByExternalId(
            workspaceId,
            activityId,
        );

        if (!!existingAudioTranscription) {
            return existingAudioTranscription;
        }

        const result = await this.externalDataService.createAudioTranscription({
            workspaceId,
            createdBy: userId,
            urlFile: existingAcitivity?.attachmentFile?.contentUrl,
            conversationId: existingAcitivity.conversationId,
            externalId: existingAcitivity.id,
        });

        if (!result?.textTranscription) {
            throw Exceptions.BAD_REQUEST;
        }

        return result;
    }
}
