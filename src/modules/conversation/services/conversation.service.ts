import { TeamPermissionTypes } from './../../team/interfaces/team.interface';
import { TemplateMessage } from './../../template-message/interface/template-message.interface';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { EventsService } from './../../events/events.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, forwardRef, Inject, BadGatewayException, NotImplementedException, Logger } from '@nestjs/common';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Conversation, IdentityType, ConversationStatus, Identity } from '../interfaces/conversation.interface';
import { FilterQuery, Model, Types } from 'mongoose';
import { ActivityDto } from './../dto/activities.dto';
import {
    KissbotEventType,
    ChannelIdConfig,
    KissbotEventDataType,
    KissbotEventSource,
    ActivityType,
    KissbotSocketType,
    IConversationWhatsappExpirationUpdated,
    ConversationTabFilter,
    IConversationAssignEvent,
    convertPhoneNumber,
    IWhatswebCheckPhoneNumberResponseEvent,
    getConversationRoomId,
    ISocketSendRequestEvent,
    IConversationSuspendedEvent,
    IConversationAddAttributeEvent,
    IConversationRemoveAttributeEvent,
    IWhatsAppSessionCountIncrementEvent,
    ConversationCloseType,
    IGupshupNumberDontExistsReceivedEvent,
    getWithAndWithout9PhoneNumber,
} from 'kissbot-core';
import { User, UserRoles } from './../../users/interfaces/user.interface';
import { UsersService } from './../../users/services/users.service';
import { CatchError, Exceptions } from './../../auth/exceptions';
import { ChannelConfigService } from './../../channel-config/channel-config.service';
import { IContact, IContactCreate } from '../../contact/interface/contact.interface';
import { ChannelConfig } from '../../channel-config/interfaces/channel-config.interface';
import { difference, isArray, isEqual } from 'lodash';
import { ContactService } from '../../contact/services/contact.service';
import { ChannelLiveAgentService } from '../../channel-live-agent/services/channel-live-agent.service';
import { ChannelConversationStart, ChannelCallbackConversationStart } from '../dto/channelConversation.dto';
import { ActivityService } from '../../activity/services/activity.service';
import { TagsService } from './../../tags/tags.service';
import * as moment from 'moment';
import { Activity } from '../../activity/interfaces/activity';
import { TeamService } from '../../team/services/team.service';
import { AssumeConversationDto } from '../dto/assume-conversation.dto';
import { WhatsappSessionControlService } from './../../whatsapp-session-control/services/whatsapp-session-control.service';
import { CloseConversationDto } from '../dto/close-conversation.dto';
import { Workspace } from '../../workspaces/interfaces/workspace.interface';
import { SuspendConversationDto } from '../dto/suspend-conversation.dto';
import { BotsService } from './../../bots/bots.service';
import { CacheService } from './../../_core/cache/cache.service';
import { AttachmentService } from './../../attachment/services/attachment.service';
import { ConversationAttributeService } from './../../conversation-attribute/service/conversation-attribute.service';
import { PrivateConversationDataService } from './../../../modules/private-conversation-data/services/private-conversation-data.service';
import {
    castObjectId,
    castObjectIdToString,
    channelMemberId,
    getCompletePhone,
    getWhatsappPhone,
    systemMemberId,
    tagSpamName,
} from './../../../common/utils/utils';
import * as Redis from 'ioredis';
import { Attribute } from '../../../modules/conversation-attribute/interfaces/conversation-attribute.interface';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../common/utils/roles';
import { ConversationQueryFilters } from '../interfaces/conversation-search.interface';
import { ConversationSearchService } from '../../../modules/analytics/search/conversation-search/services/conversation-search.service';
import { ConversationSearch } from 'kissbot-entities';
import { PaginatedModel } from '../../../common/interfaces/paginated';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { SendTemplateFileData } from '../interfaces/send-template-file.interface';
import {
    TemplateButtonType,
    TemplateStatus,
    TemplateType,
} from '../../template-message/schema/template-message.schema';
import { rabbitMsgLatency } from '../../../common/utils/prom-metrics';
import * as Sentry from '@sentry/node';
import { ExternalDataService } from './external-data.service';
import { CreateMultipleConversation } from '../dto/create-multiple-conversation';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { AgentCreateConversationEventData } from '../interfaces/create-conversation-event-data.interface';
import { ResultCreateMultipleConversation } from '../interfaces/result-create-multiple-conversation.interface';
import { canSendEventConversationCreatedByChannel } from '../../../common/utils/canSendEventConversationCreatedByChannel';
import { CloseConversationWithCategorizationDto } from '../dto/close-conversation-with-categorization.dto';
import { isOnlyOneEmoji } from '../../../common/utils/isOnlyOneEmoji';
import { Team } from '../../../modules/team-v2/interfaces/team.interface';
import { TemplateButton } from '../../template-message/dto/template-message.dto';

export const createAgentConversationTopicName = `create_agent_conversation`;

const activityToUpdateTimestamp = [
    ActivityType.message,
    ActivityType.rating_message,
    ActivityType.member_upload_attachment,
    ActivityType.member_added,
    ActivityType.member_disconnected,
    ActivityType.bot_took_on,
    ActivityType.bot_disconnected,
    ActivityType.member_exit,
    ActivityType.member_removed,
    ActivityType.end_conversation,
];

@Injectable()
export class ConversationService extends MongooseAbstractionService<Conversation> {
    private redisIIdKey = 'iid_key';

    private readonly logger = new Logger(ConversationService.name);

    constructor(
        @InjectModel('Conversation') protected readonly model: Model<Conversation>,
        private userService: UsersService,
        public readonly eventsService: EventsService,
        public readonly botService: BotsService,
        @Inject(forwardRef(() => ChannelConfigService))
        private readonly channelConfigService: ChannelConfigService,
        @Inject(forwardRef(() => ContactService))
        private readonly contactService: ContactService,
        @Inject(forwardRef(() => ChannelLiveAgentService))
        private readonly channelLiveAgentService: ChannelLiveAgentService,
        @Inject(forwardRef(() => ActivityService))
        private readonly activityService: ActivityService,
        private readonly templateMessageService: TemplateMessageService,
        private readonly tagsService: TagsService,
        private readonly teamService: TeamService,
        private readonly whatsappSessionControlService: WhatsappSessionControlService,
        public cacheService: CacheService,
        @Inject(forwardRef(() => AttachmentService))
        private readonly attachmentService: AttachmentService,
        private readonly conversationAttributesService: ConversationAttributeService,
        private readonly privateConversationDataService: PrivateConversationDataService,
        private readonly conversationSearchService: ConversationSearchService,
        private readonly workspacesService: WorkspacesService,
        private readonly externalDataService: ExternalDataService,
        private kafkaService: KafkaService,
    ) {
        super(model, cacheService, eventsService, 600);
    }

    @CatchError()
    async _create(conversationDto?: any): Promise<Conversation> {
        try {
            const conversationsAttributes = conversationDto.attributes || [];
            const workspace = conversationDto ? conversationDto.workspace || '' : '';
            const members: Identity[] = conversationDto ? conversationDto.members || [] : [];
            const suspendedUntil: number = (conversationDto && conversationDto.suspendedUntil) || 0;

            //tempo de expiracão do atendimento, default 1 hora
            const expirationTime: number = (conversationDto && conversationDto.expirationTime) || 3600000;

            const now = moment().valueOf();

            //tempo do evento before_expiration_time, 50% do tempo de expiracão
            const beforeExpirationTime: number =
                (conversationDto && conversationDto.beforeExpirationTime) || expirationTime * 0.5;

            const beforeExpiresAt = now + beforeExpirationTime;
            const expiresAt = now + expirationTime;

            if (expiresAt == beforeExpiresAt) {
                //AQUI PODE TER UM ERRO;
                console.log('errooo expiresAt == beforeExpiresAt -> ', JSON.stringify(conversationDto));
            }

            const conversation = new this.model({
                _id: conversationDto._id || undefined,
                expiresAt,
                beforeExpiresAt,
                expirationTime,
                beforeExpirationTime,
                members,
                token: conversationDto ? conversationDto.token || '' : '',
                hash: undefined,
                tags: conversationDto ? conversationDto.tags : [],
                createdByChannel: conversationDto ? conversationDto.createdByChannel : 'webchat',
                organizationId: conversationDto.organizationId,
                state: ConversationStatus.open,
                iid: await this.getIId((workspace || {})._id),
                data: conversationDto ? conversationDto.data || null : null,
                workspace,
                bot: conversationDto && conversationDto.bot ? conversationDto.bot : null,
                createdAt: conversationDto.createdAt || new Date().toISOString(),
                priority: conversationDto?.priority || 0,
                waitingSince: 0,
                order: 0,
                assignedToTeamId: conversationDto.assignedToTeamId,
                assignedToUserId: conversationDto.assignedToUserId,
                whatsappExpiration: conversationDto.whatsappExpiration,
                shouldRequestRating: conversationDto.shouldRequestRating,
                suspendedUntil,
                whatsappSessionCount: 0,
                timezone: workspace?.timezone,
                referralSourceId: conversationDto.referralSourceId,
            });

            const createPrivateConversationDataPromise = this.privateConversationDataService.create({
                conversationId: conversation._id,
                privateData: conversationDto.privateData,
                endMessage: conversationDto?.endMessage,
            });
            await Promise.all([
                createPrivateConversationDataPromise,
                this.create(conversation),
                this.conversationAttributesService._create(conversation._id, conversationsAttributes),
            ]);

            const rawConversation = conversation.toJSON({ minimize: false });
            rawConversation.attributes = conversationsAttributes;

            this.eventsService
                .sendEvent({
                    data: rawConversation,
                    dataType: KissbotEventDataType.CONVERSATION,
                    source: KissbotEventSource.CONVERSATION_MANAGER,
                    type: KissbotEventType.CONVERSATION_CREATED,
                })
                .then();

            const canSendEventCreatedConversation = canSendEventConversationCreatedByChannel(conversation as any);
            if (canSendEventCreatedConversation) {
                this.channelLiveAgentService.dispatchSocket(conversation, {
                    message: conversation,
                    type: KissbotSocketType.CONVERSATION,
                });
                this.channelLiveAgentService.dispatchSocket(conversation, {
                    message: {
                        attributes: conversationsAttributes,
                        conversationId: conversation._id,
                    },
                    type: KissbotSocketType.CONVERSATION_ATTRIBUTES_UPDATED,
                });
            }
            return conversation;
        } catch (e) {
            Sentry.captureEvent({
                message: 'ConversationService._create',
                extra: {
                    error: e,
                },
            });
            throw e;
        }
    }

    /**
     * Retorna o iid da conversa
     */
    @CatchError()
    async getIId(workspaceId: string) {
        const redisClient: Redis.Redis | null = this.cacheService.getClient();
        let iidKey: number;
        if (redisClient) {
            iidKey = parseInt(await redisClient.get(this.getIIdRedisKey(workspaceId)), 10);
        }
        if (!iidKey) {
            const lastCreatedConversation = await this.model
                .findOne({ 'workspace._id': workspaceId })
                .sort({ _id: -1 })
                .limit(1)
                .exec();
            iidKey = parseInt(
                lastCreatedConversation && lastCreatedConversation.iid ? lastCreatedConversation.iid : '0',
            );
            if (redisClient) {
                await redisClient.set(this.getIIdRedisKey(workspaceId), iidKey);
            }
        }
        try {
            if (redisClient) {
                await redisClient.incr(this.getIIdRedisKey(workspaceId));
                return iidKey;
            }
            return iidKey + 1;
        } catch (e) {
            return iidKey + 1;
        }
    }

    getIIdRedisKey(workspaceId: string) {
        return `${this.redisIIdKey}:${workspaceId}`;
    }

    getSearchFilter(search: string): any {
        if (search?.[0] === '#') {
            const iid = search.replace('#', '');
            if (iid) {
                return {
                    iid,
                };
            }
        }
    }

    getEventsData() {}

    @CatchError()
    public async updateWhatsappExpiration(ev: IConversationWhatsappExpirationUpdated) {
        const conversation = await this.findOne({ _id: ev.conversationId });

        if (!conversation) return;

        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(conversation.token);

        if (!channelConfig || channelConfig.channelId !== ChannelIdConfig.gupshup) {
            return;
        }

        await this.whatsappSessionControlService.create({
            channelConfigId: conversation?.token,
            originNumber: ev.phoneNumber,
            integrationToken: channelConfig.configData?.apiKey,
            whatsappExpiration: ev.timestamp,
            workspaceId: conversation.workspace._id,
        });

        await this.updateRaw({ _id: ev.conversationId }, { whatsappExpiration: ev.timestamp });

        const data: IConversationWhatsappExpirationUpdated = ev;

        const rooms = getConversationRoomId(conversation);

        const socketEvent: ISocketSendRequestEvent = {
            data: {
                message: {
                    whatsappExpiration: data.timestamp,
                    socket: true,
                    conversationId: data.conversationId,
                },
                type: KissbotSocketType.CONVERSATION_WHATSAPP_EXPIRATION_UPDATED,
            },
            room: rooms,
        };
        this.eventsService.sendEvent({
            data: socketEvent,
            dataType: KissbotEventDataType.ANY,
            source: KissbotEventSource.CONVERSATION_MANAGER,
            type: KissbotEventType.SOCKET_SEND_REQUEST,
        });
    }

    @CatchError()
    async updateConversationSessionCount(phoneNumber: string, conversationId: string, channelConfigToken: string) {
        const key = `CONV_SESS:${channelConfigToken}:${phoneNumber}`;

        const client = await this.cacheService.getClient();
        const timestamp = await client.get(key);

        if (!timestamp) {
            await this.updateRaw(
                { _id: conversationId },
                {
                    $inc: {
                        whatsappSessionCount: 1,
                    },
                },
            );
            const conversation = await this.findOne({ _id: conversationId });

            this.eventsService.sendEvent({
                data: <IWhatsAppSessionCountIncrementEvent>{
                    whatsappSessionCount: conversation.whatsappSessionCount,
                    conversationId,
                },
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.CONVERSATION_WHATSAPP_SESSION_COUNT_INCREMENT,
            });
            const now = moment().valueOf();
            await client.set(key, now);
            await client.expire(key, 86400);
        }
    }

    private async getConversationActivities(conversation: Conversation, allActivities?: boolean) {
        const conversationId = castObjectIdToString(conversation._id);
        try {
            const activities = await this.activityService.getConversationActivitiesPostgres(
                castObjectIdToString(conversationId),
                conversation.workspace._id,
            );
            // this.logger.debug(`GETTING ACTIVITIES FROM POSTGRES conversationId: ${conversationId}`);
            return activities;
        } catch (e) {
            // return await this.activityService.getConversationActivities(
            //     castObjectIdToString(conversationId),
            //     allActivities,
            // );
        }
    }

    @CatchError()
    async getConversationWithActivities(user: User, workspaceId: string, conversationId: string) {
        // @todo - foi desativado o queryFilteredPermissionConversation, pois estava impactando no comportamento que já existia
        // futuramente devera ser analisado como sera implementado.

        // const queryFilteredPermissionConversation = (await this.getQueryPermissionTeam(user, workspaceId)) || {};
        const newQuery = {
            $and: [
                { _id: conversationId, 'workspace._id': workspaceId },
                // { ...queryFilteredPermissionConversation }
            ],
        };

        const conversation = await this.model.findOne(newQuery);
        if (!conversation) {
            // const isAnyAdmin = isAnySystemAdmin(user) || isWorkspaceAdmin(user, workspaceId);
            // if (!isAnyAdmin) {
            //     throw Exceptions.NO_PERMISSION_TO_ACESS_CONVERSATION;
            // }
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }
        const leanConversation: any = conversation.toJSON({ minimize: false });
        const attachments = await this.attachmentService.getAttachmentsByConversationId(conversationId);
        const attributes = await this.conversationAttributesService.getConversationAttributes(conversationId);
        const activities = await this.getConversationActivities(conversation, true);
        const audioTranscriptions = await this.externalDataService.getAudioTranscriptionsByConversationId(
            workspaceId,
            castObjectIdToString(conversation._id),
        );
        leanConversation.activities = activities;
        leanConversation.fileAttachments = (attachments || []).map((att) => ({
            contentUrl: att.attachmentLocation,
            memberId: att.memberId,
            mimeType: att.mimeType,
            name: att.name,
            timestamp: att.timestamp,
            _id: att._id,
        }));
        leanConversation.attributes = attributes?.data || [];
        leanConversation.audioTranscriptions = audioTranscriptions || [];
        return leanConversation;
    }

    @CatchError()
    public async assumeConversation(
        body: AssumeConversationDto,
        conversationId: string,
        userId: string,
        workspaceId: string,
    ) {
        const conversation: Conversation = await this.model.findOne({ _id: conversationId });
        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        if (conversation.state !== ConversationStatus.open) {
            throw Exceptions.CONVERSATION_CLOSED;
        }

        const userToAdd = await this.userService.getOne(userId);
        if (!userToAdd) throw Exceptions.BAD_GATEWAY;

        const team = await this.teamService.findOne({
            _id: castObjectId(body.teamId),
            $or: [{ deletedAt: undefined }, { deletedAt: { $exists: true } }, { deletedAt: { $exists: false } }],
        });
        if (!team) {
            throw Exceptions.TEAM_NOT_FOUND;
        }

        const isWorkspaceAdmin = userToAdd.roles.find(
            (role) => role.role == UserRoles.WORKSPACE_ADMIN && role.resourceId == workspaceId,
        );
        const isAnyAdmin = isAnySystemAdmin(userToAdd);

        if (!isAnyAdmin && !isWorkspaceAdmin) {
            const roleUser = team.roleUsers.find((role) => {
                if (typeof role.userId !== 'string') {
                    role.userId = role.userId;
                }

                return role.userId.toString() == userId;
            });
            const isUserOnTeam = !!roleUser;

            if (!isUserOnTeam) {
                throw Exceptions.USER_NOT_ON_TEAM;
            }

            if (!!roleUser?.permission?.canViewHistoricConversation) {
                throw Exceptions.NO_PERMISSION_TO_ACESS_CONVERSATION;
            }
        }

        const userAlreadyExist = conversation.members?.find(
            (currMember) => currMember.id === userId && currMember.disabled,
        );

        // Caso seja a primeira vez que o usuario está assumindo a conversa
        if (!userAlreadyExist) {
            const member: Identity = {
                id: castObjectIdToString(userToAdd._id),
                name: userToAdd.name,
                channelId: ChannelIdConfig.liveagent,
                type: IdentityType.agent,
                avatar: userToAdd.avatar,
                disabled: false,
                metrics: {
                    assumedAt: +new Date(),
                },
            };

            const addToSetMembers = [];
            let updateConversationParams: any = {};

            const agentExists = conversation.members.find((mem) => mem.id == member.id);
            if (!agentExists && !!member) {
                addToSetMembers.push(member);
            }

            const channelExists = conversation.members.find((mem) => mem.type == IdentityType.channel);
            if (!channelExists) {
                const channelMember: Identity = {
                    channelId: ChannelIdConfig.liveagent,
                    id: channelMemberId,
                    name: '',
                    type: IdentityType.channel,
                };
                addToSetMembers.push(channelMember);
            }
            if (addToSetMembers.length) {
                updateConversationParams = {
                    ...updateConversationParams,
                    $addToSet: {
                        members: addToSetMembers,
                    },
                };
            }

            updateConversationParams = {
                ...updateConversationParams,
                assignedToUserId: userId,
                assignedToTeamId: team._id,
            };

            await this.updateRaw(
                {
                    _id: conversationId,
                },
                updateConversationParams,
            );

            await this.disableBot(castObjectIdToString(conversation._id));
            await this.disableSystem(castObjectIdToString(conversation._id));
            if (!agentExists) {
                await this.dispatchMemberAddedActivity(conversation, member);
            }

            if (!new Types.ObjectId(conversation.assignedToTeamId).equals(castObjectId(team._id))) {
                await this.dispatchAssignedToTeamActivity(conversation, {
                    userId,
                    team: team as any,
                    conversationId,
                    assignedByMember: member,
                });
            }

            this.publishMemberUpdatedEvent(conversationId);
        } else {
            // Caso não seja a primeira vez que o usuario está assumindo a conversa apenas habilita novamente;
            await this.enableMember(conversationId, userAlreadyExist.id);

            const updatedConversation = await this.model.findOne({ _id: conversationId });

            this.channelLiveAgentService.dispatchSocket(conversation, {
                message: updatedConversation,
                type: KissbotSocketType.CONVERSATION_UPDATED,
            });

            this.channelLiveAgentService.dispatchSocket(conversation, {
                message: {
                    members: updatedConversation.members,
                    workspaceId: updatedConversation.workspace._id,
                    _id: conversationId,
                },
                type: KissbotSocketType.CONVERSATION_MEMBERS_UPDATED,
            });
            this.publishMemberUpdatedEvent(conversationId);
        }
    }

    @CatchError()
    public async dispatchAssignedToTeamActivity(conversation: Conversation, assign: IConversationAssignEvent) {
        const activityRequestDto: ActivityDto = {
            type: ActivityType.assigned_to_team,
            from: assign.assignedByMember,
            data: {
                teamId: assign.team._id,
            },
        };
        await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
        assign.conversation = {
            members: conversation.members,
            assignedToTeamId: conversation.assignedToTeamId,
        };

        this.eventsService.sendEvent({
            data: assign as IConversationAssignEvent,
            dataType: KissbotEventDataType.CONVERSATION,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONVERSATION_ASSIGNED,
        });
    }

    /**
     * Habilita um membro que não exista na conversa e envia a activity correspondente a essa ação
     * @param conversationId
     * @param memberId
     */
    @CatchError()
    async addMember(conversationId: string, member: Identity, sendActivity = true) {
        const conversation = await this.model.findOne({ _id: conversationId });
        const agentExists = conversation.members.find((mem) => mem.id == member.id);
        if (!agentExists && !!member) {
            // @ts-ignore
            await this.updateRaw(
                { _id: conversationId },
                // @ts-ignore
                {
                    $addToSet: {
                        members: member,
                    },
                },
            );
            if (sendActivity) {
                await this.dispatchMemberAddedActivity(conversation, member);
            }
            this.publishMemberUpdatedEvent(conversationId);
        }
    }

    /**
     * Desabilita um membro do tipo bot que já exista na conversa e envia a activity correspondente a essa ação
     * @param conversationId
     * @param memberId
     */
    @CatchError()
    async disableBot(conversationId: string) {
        const conversation = await this.model.findOne({ _id: conversationId });
        const botMember = conversation.members.find((member) => member.type === IdentityType.bot && !member.disabled);
        if (botMember) {
            // desabilita o bot
            await this.updateRaw(
                {
                    _id: conversation._id,
                    'members.id': botMember.id,
                },
                {
                    $set: {
                        'members.$.disabled': true,
                    },
                },
            );
            const activityRequestDto: ActivityDto = {
                type: ActivityType.bot_disconnected,
                from: botMember,
                to: botMember,
            };
            await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
        }
    }

    /**
     * Desabilita um membro do tipo system que já exista na conversa e envia a activity correspondente a essa ação
     * @param conversationId
     * @param memberId
     */
    @CatchError()
    async disableSystem(conversationId: string) {
        const conversation = await this.model.findOne({ _id: conversationId });
        const systemMember = conversation.members.find(
            (member) => member.type === IdentityType.system && !member.disabled,
        );
        if (systemMember) {
            // desabilita o bot
            await this.updateRaw(
                {
                    _id: conversation._id,
                    'members.type': IdentityType.system,
                },
                {
                    $set: {
                        'members.$.disabled': true,
                    },
                },
            );
            const activityRequestDto: ActivityDto = {
                type: ActivityType.bot_disconnected,
                from: systemMember,
                to: systemMember,
            };
            await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
        }
    }

    @CatchError()
    private async dispatchSuspendedConversationActivity(
        conversation: Conversation,
        member: Identity,
        suspendedUntil: number,
    ) {
        const activityRequestDto: ActivityDto = {
            type: ActivityType.suspend_conversation,
            from: member,
            to: member,
            data: { until: suspendedUntil },
        };
        await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
    }

    @CatchError()
    private async dispatchMemberAddedActivity(conversation: Conversation, agentMember: Identity) {
        const activityRequestDto: ActivityDto = {
            type: ActivityType.member_added,
            from: agentMember,
            to: agentMember,
        };
        await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
    }

    @CatchError()
    async dispatchEndConversationActivity(conversationId: string, agentMember: Identity, data?: any) {
        const activityRequestDto: ActivityDto = {
            type: ActivityType.end_conversation,
            from: agentMember,
            to: agentMember,
            data: data,
        };
        await this.activityService.handleActivity(activityRequestDto, conversationId);
    }

    @CatchError()
    private async dispatchRatingConversationActivity(conversation: Conversation, agentMember: Identity) {
        const activityRequestDto: ActivityDto = {
            type: ActivityType.rating,
            from: agentMember,
            to: agentMember,
        };
        await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
    }

    @CatchError()
    public async newActivityReaction(workspaceId: string, conversationId: string, activityDto: ActivityDto) {
        // executa apenas validações para ver se o tipo de activity é do tipo reação e envia pela função padrão de envio

        if (!activityDto?.data?.reactionHash || !activityDto.text) {
            throw Exceptions.ERROR_MISSING_MANDATORY_FIELD;
        }

        if (activityDto.type !== ActivityType.message && activityDto.type !== ActivityType.member_upload_attachment) {
            throw Exceptions.INVALID_TYPE_ACTIVITY;
        }

        if (!isOnlyOneEmoji(activityDto.text)) {
            throw Exceptions.INVALID_TYPE_REACTION_MESSAGE;
        }

        activityDto.quoted = activityDto?.data?.reactionHash;

        await this.newActivity(workspaceId, conversationId, activityDto);
    }

    @CatchError()
    public async newActivity(workspaceId: string, conversationId: string, activityDto: ActivityDto) {
        const conversation: Conversation = await this.findOne({ _id: conversationId });
        let sendActivity: (conversation: any, activityDto: ActivityDto) => Promise<Activity>;

        const memberSending = activityDto.from;
        const existingMember = conversation.members.find((mem) => mem.id == memberSending.id);

        if (existingMember.disabled) {
            throw Exceptions.DISABLED_MEMBER_CANNOT_SEND_MESSAGE;
        }

        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        if (conversation.state !== ConversationStatus.open) {
            throw Exceptions.CONVERSATION_CLOSED;
        }

        if (!!activityDto?.quoted && activityDto.type === ActivityType.comment) {
            // Lança excesssão caso tente enviar mensagem de resposta como comentario
            throw Exceptions.INVALID_TYPE_ACTIVITY;
        }

        switch (activityDto.type) {
            case ActivityType.comment:
                sendActivity = this.dispatchCommentAtivity.bind(this);
                break;

            default:
                sendActivity = this.dispatchMessageActivity.bind(this);
        }

        const activity = await sendActivity(conversation, activityDto);

        this.viewConversation(workspaceId, castObjectIdToString(conversation._id), activity.from.id, { viewed: true });
    }

    @CatchError()
    async closeAssignedConversations(workspaceId: string) {
        const conversations = await this.model.find(
            {
                'workspace._id': workspaceId,
                state: ConversationStatus.open,
                assignedToTeamId: {
                    $exists: true,
                    $ne: null,
                },
            },
            {
                members: 1,
                _id: 1,
            },
        );
        await this.systemCloseConversations(conversations);
    }

    @CatchError()
    async sendTemplateFile(data: SendTemplateFileData) {
        const conversation = await this.model.findOne({ _id: data.conversationId });

        if (moment().valueOf() >= conversation.whatsappExpiration && !data.templateId) {
            throw Exceptions.WHATSAPP_CONVERSATION_EXPIRED;
        }

        let requireHsmTemplate =
            moment().valueOf() >= conversation.whatsappExpiration && conversation.whatsappExpiration !== 0;

        let templateMessage: TemplateMessage | undefined;
        let channel: { name?: string } & Partial<ChannelConfig>;

        if (data.templateId) {
            channel = await this.channelConfigService.getOneBtIdOrToken(conversation.token);

            templateMessage = (
                await this.templateMessageService.findOne({
                    _id: data.templateId,
                    $or: [
                        { channels: { $exists: false } },
                        { channels: { $size: 0 } },
                        { channels: { $in: [channel._id] } },
                    ],
                })
            )?.toJSON?.() as TemplateMessage;
        }
        if (!templateMessage) {
            throw Exceptions.TEMPLATE_MESSAGE_NOT_FOUND;
        }

        if (!!requireHsmTemplate && !templateMessage.isHsm) {
            throw Exceptions.TEMPLATE_HSM_REQUIRED;
        }

        if (templateMessage.type !== TemplateType.file) {
            throw Exceptions.CANNOT_SEND_TEMPLATE_TYPE;
        }

        const memberUploader = conversation.members.find((mem) => mem.id == data.memberId);

        if (!!requireHsmTemplate && templateMessage.isHsm) {
            const activity: any = {
                type: ActivityType.message,
                from: memberUploader,
                text: data.message,
                conversationId: conversation._id,
                templateId: templateMessage._id,
                templateVariableValues: data?.attributes,
            };
            return await this.dispatchMessageActivity(conversation, activity as any);
        }

        const newFileKey = await this.attachmentService.getAttachmentKey(
            conversation,
            templateMessage.fileOriginalName,
        );
        await this.templateMessageService.copyFileToAttachmentBucket(templateMessage.fileKey, newFileKey);

        const activityData: any = {};

        if (templateMessage?.tags?.length) {
            const tags = await this.tagsService.getAll({
                _id: {
                    $in: templateMessage.tags,
                },
                workspaceId: conversation.workspace._id,
            });
            await this.addTags(castObjectIdToString(conversation._id), tags);
        }

        let activityAttachments = null;
        if (templateMessage?.buttons?.length) {
            activityAttachments = this.transformActivityAttachmentsWithButtons(templateMessage.buttons, data.message);
        }

        await this.attachmentService._create(
            conversation,
            memberUploader,
            templateMessage.fileOriginalName,
            templateMessage.fileContentType,
            null, //quoted
            null, // attachmentLocation
            newFileKey,
            null, //activityHash
            false, //isStartActivity
            templateMessage.fileSize,
            data.message, // text
            false, // isHsm
            activityData,
            activityAttachments,
        );
    }

    @CatchError()
    async dispatchCommentAtivity(conversation: Conversation, activityDto: ActivityDto) {
        const activity: Activity = {
            ...activityDto,
            timestamp: moment().utc(false).valueOf(),
        } as Activity;

        return await this.activityService.handleActivity(
            activity,
            castObjectIdToString(conversation._id),
            conversation,
        );
    }

    private async renderTemplateTextButtons(buttons: any[], text: string) {
        const textButtons = buttons.reduce((acc, button) => {
            return acc + ` | [${button.text}${button?.url ? `,${button.url}` : ''}]`;
        }, '');
        return text + textButtons;
    }
    private transformActivityAttachmentsWithButtons(
        buttons: TemplateButton[],
        text: string,
        title?: string,
        subtitle?: string,
    ) {
        const buildAsFlow = !!(buttons.length === 1 && buttons[0].flowDataId);
        const buildAsQuickReply = buttons.length > 0 && buttons.length <= 3 && !buildAsFlow;
        const buildAsList = buttons.length > 3;
        const buttonsFormated = buttons.map((button, index) => {
            return {
                index,
                type:
                    button.type === TemplateButtonType.URL
                        ? 'openUrl'
                        : button.type === TemplateButtonType.FLOW
                        ? 'flow'
                        : 'imBack',
                title: button.text,
                value: button?.url || button?.flowDataId || null,
            };
        });

        const attachments = [
            {
                content: {
                    buildAsQuickReply: buildAsQuickReply,
                    buildAsList: buildAsList,
                    buildAsFlow: buildAsFlow,
                    buttons: buttonsFormated,
                    text,
                    title,
                    subtitle,
                },
                contentType: 'application/vnd.microsoft.card.hero',
            },
        ];
        return attachments;
    }
    @CatchError()
    async dispatchMessageActivity(conversation: Conversation, activityDto: ActivityDto) {
        const templateId = activityDto.templateId;

        if (
            moment().valueOf() >= conversation.whatsappExpiration &&
            !templateId &&
            activityDto.type === ActivityType.message
        ) {
            throw Exceptions.WHATSAPP_CONVERSATION_EXPIRED;
        }
        delete activityDto.templateId;

        const activity: Activity = {
            ...activityDto,
            timestamp: moment().utc(false).valueOf(),
        } as Activity;

        if (activityDto.type === ActivityType.message) {
            const requireHsmTemplate =
                moment().valueOf() >= conversation.whatsappExpiration && conversation.whatsappExpiration !== 0;

            let templateMessage: TemplateMessage | undefined;
            let channel: { name?: string } & Partial<ChannelConfig>;

            if (templateId) {
                channel = await this.channelConfigService.getOneBtIdOrToken(conversation.token);

                templateMessage = (
                    await this.templateMessageService.findOne({
                        _id: templateId,
                        $or: [
                            { channels: { $exists: false } },
                            { channels: { $size: 0 } },
                            { channels: { $in: [channel._id] } },
                        ],
                    })
                )?.toJSON?.() as TemplateMessage;

                if (!templateMessage) {
                    throw Exceptions.TEMPLATE_MESSAGE_NOT_FOUND;
                }
            }

            if (!!requireHsmTemplate && !templateMessage.isHsm) {
                throw Exceptions.TEMPLATE_HSM_REQUIRED;
            }

            if (templateMessage?.tags?.length) {
                const tags = await this.tagsService.getAll({
                    _id: {
                        $in: templateMessage.tags,
                    },
                    workspaceId: conversation.workspace._id,
                });

                await this.addTags(castObjectIdToString(conversation._id), tags);
            }

            if (templateMessage?.isHsm) {
                activity.isHsm = true;
                activity.templateId = templateId;

                const templateStatusApproved =
                    templateMessage?.wabaResult?.[castObjectIdToString(channel._id)]?.status ===
                    TemplateStatus.APPROVED;

                if (!templateMessage?.wabaResult?.[castObjectIdToString(channel?._id)]?.wabaTemplateId) {
                    throw Exceptions.TEMPLATE_HSM_REQUIRED;
                }

                if (!templateStatusApproved) {
                    throw Exceptions.TEMPLATE_MESSAGE_STATUS_INVALID;
                }

                if (!activity.data || typeof activity.data !== 'object') {
                    activity.data = {};
                }

                activity.data.wabaTemplateId =
                    templateMessage?.wabaResult?.[castObjectIdToString(channel._id)]?.wabaTemplateId;
                activity.data.templateVariableValues = activityDto.templateVariableValues;

                try {
                    if (templateMessage.type === TemplateType.file && templateMessage.fileUrl) {
                        const newFileKey = await this.attachmentService.getAttachmentKey(
                            conversation,
                            templateMessage.fileOriginalName,
                        );

                        await this.templateMessageService.copyFileToAttachmentBucket(
                            templateMessage.fileKey,
                            newFileKey,
                        );
                        const attachment = await this.attachmentService._create(
                            conversation,
                            activity.from,
                            templateMessage.fileOriginalName,
                            templateMessage.fileContentType,
                            null, //quoted
                            null, // attachmentLocation
                            newFileKey,
                            null, //activityHash
                            true, //isStartActivity
                            templateMessage.fileSize,
                            activity.text, // text
                            templateMessage.isHsm,
                            activity.data,
                        );
                        activity.type = ActivityType.member_upload_attachment;
                        activity.attachmentFile = {
                            contentType: attachment.mimeType,
                            contentUrl: attachment.attachmentLocation,
                            name: attachment.name,
                            key: attachment.key,
                            id: attachment._id,
                        } as any;
                    }
                } catch (err) {
                    Sentry.captureEvent({
                        message: `${ConversationService.name}.dispatchMessageActivity - attachment template on activity`,
                        extra: {
                            error: err,
                        },
                    });
                }
            }

            if (templateMessage?.buttons?.length) {
                activity.attachments = this.transformActivityAttachmentsWithButtons(
                    templateMessage.buttons,
                    activity.text,
                );
            }
            if (!requireHsmTemplate && !!templateMessage?.isHsm) {
                activity.isHsm = false;
                delete activity?.data?.wabaTemplateId;
                delete activity?.data?.templateVariableValues;
                delete activity?.templateId;
            }

            try {
                if (!requireHsmTemplate && activity?.text?.length <= 4000) {
                    const workspace = await this.workspacesService.getOne(conversation.workspace._id);
                    const isAgent =
                        conversation?.members?.find((member) => member?.id === activity?.from?.id)?.type ===
                        IdentityType.agent;
                    if (
                        workspace &&
                        workspace?.featureFlag?.enableConcatAgentNameInMessage &&
                        isAgent &&
                        activity?.from?.name &&
                        !activity?.quoted
                    ) {
                        if (activity?.attachments?.[0]?.content?.text) {
                            activity.attachments[0].content.text = `*${activity.from.name}*:\n\n${activity.attachments[0].content.text}`;
                        } else {
                            activity.text = `*${activity.from.name}*:\n\n${activity.text}`;
                        }
                    }
                }
            } catch (e) {
                console.log(`${ConversationService.name}.dispatchMessageActivity - ERROR concat agent name in message`);
                Sentry.captureEvent({
                    message: `${ConversationService.name}.dispatchMessageActivity - ERROR concat agent name in message`,
                    extra: {
                        error: e,
                    },
                });
            }
        }

        const createdActivity = await this.activityService.handleActivity(
            activity,
            castObjectIdToString(conversation._id),
        );
        return createdActivity;
    }

    @CatchError()
    public async suspendConversation(
        workspaceId: string,
        conversationId: string,
        memberId: string,
        suspendConversationDto: SuspendConversationDto,
    ): Promise<void> {
        const conversation: Conversation = await this.findOne({ _id: conversationId });

        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        const member = conversation.members.find((currMember: Identity) => currMember.id === memberId);

        if (conversation.state === ConversationStatus.closed) throw Exceptions.ONLY_OPEN_CONVERSATION_CAN_BE_SUSPENDED;

        if (!member) throw Exceptions.DONT_PARTICIPATE_IN_THE_CONVERSATION;

        await this.updateRaw(
            { _id: conversationId },
            {
                suspendedUntil: suspendConversationDto.until,
            },
        );

        await this.dispatchSuspendedConversationActivity(conversation, member, suspendConversationDto.until);

        this.eventsService.sendEvent({
            data: {
                conversationId: conversation._id,
                until: suspendConversationDto.until,
            } as IConversationSuspendedEvent,
            dataType: KissbotEventDataType.ANY,
            source: KissbotEventSource.CONVERSATION_MANAGER,
            type: KissbotEventType.CONVERSATION_SUSPENDED,
        });
    }

    public async closeConversationWithCategorization(
        workspaceId: string,
        conversationId: string,
        memberId: string,
        data: CloseConversationWithCategorizationDto,
        closeType?: ConversationCloseType,
    ): Promise<void> {
        const isConversationClosedWithSuccess = await this.closeConversation(
            workspaceId,
            conversationId,
            memberId,
            { message: data.message },
            closeType,
        );
        if (!isConversationClosedWithSuccess) {
            return;
        }
        if (data.objectiveId && data.outcomeId) {
            await this.externalDataService.createConversationCategorization(workspaceId, {
                ...data,
                conversationId,
                userId: memberId,
                objectiveId: data.objectiveId,
                outcomeId: data.outcomeId,
            });
        }
        if (data.conversationTags?.length > 0) {
            const tags = data.conversationTags.map((tag) => ({ name: tag }));
            await this.addTags(conversationId, tags);
        }
    }

    @CatchError()
    public async closeConversation(
        workspaceId: string,
        conversationId: string,
        memberId: string,
        closeConversationDto: CloseConversationDto,
        closeType?: ConversationCloseType,
    ): Promise<boolean> {
        try {
            const conversation: Conversation = await this.model.findOne({ _id: conversationId });

            if (!conversation) {
                throw Exceptions.CONVERSATION_NOT_FOUND;
            }

            if (conversation.workspace._id !== workspaceId) {
                throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
            }

            const member = conversation.members.find((currMember: Identity) => currMember.id === memberId);

            const { message } = closeConversationDto;

            if (conversation.state === ConversationStatus.closed) throw Exceptions.ALREADY_CLOSED;

            if (!member) throw Exceptions.DONT_PARTICIPATE_IN_THE_CONVERSATION;

            await this.viewConversation(workspaceId, conversationId, memberId, { viewed: true });

            if (message) {
                await this.newActivity(workspaceId, conversationId, {
                    type: ActivityType.message,
                    from: member,
                    to: member,
                    text: message,
                });

                await new Promise((r) => setTimeout(r, 250));
            }

            await this.dispatchEndConversationActivity(castObjectIdToString(conversation._id), member, { closeType });
            const { shouldRequestRating } = conversation;

            if (shouldRequestRating) {
                await this.startConversationRating(conversation, member);
            }
        } catch (error) {
            return false;
        }
        return true;
    }

    @CatchError()
    public async startConversationRating(conversation: Conversation, ratingRequesterMember: Identity): Promise<void> {
        const systemMember = conversation.members.find((m) => m.type == IdentityType.system);
        if (systemMember && systemMember.channelId != 'rating') {
            await this.updateMember(castObjectIdToString(conversation._id), {
                ...((systemMember as any).toJSON ? (systemMember as any).toJSON({ minimize: false }) : systemMember),
                disabled: false,
                channelId: 'rating',
            });
        } else if (!systemMember) {
            await this.addMember(
                castObjectIdToString(conversation._id),
                {
                    channelId: 'rating',
                    id: systemMemberId,
                    type: IdentityType.system,
                    name: 'system',
                },
                false,
            );
        }
        await this.disableBot(castObjectIdToString(conversation._id));
        await this.dispatchRatingConversationActivity(conversation, ratingRequesterMember);
    }

    @CatchError()
    public async unsubscribeFromConversation(
        workspaceId: string,
        conversationId: string,
        memberId: string,
    ): Promise<void> {
        const conversation: Conversation = await this.model.findOne({ _id: conversationId });

        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        const { members } = conversation;
        const newMembers: Identity[] = [];

        const member = members.find((existingMember) => existingMember.id == memberId);

        if (member?.disabled) {
            throw Exceptions.MEMBER_ALREADY_DISABLED;
        }

        await this.disableMember(conversationId, member.id);

        const existsAgentOrTeamInConversation =
            conversation.assignedToTeamId ||
            !!newMembers.find((existingMember) => {
                return existingMember.type == IdentityType.agent && !existingMember.disabled;
            });

        if (!existsAgentOrTeamInConversation) {
            await this.enableBot(conversationId);
        }

        this.publishMemberUpdatedEvent(conversationId);
    }

    @CatchError()
    public async unsubscribeByAdminFromConversation(
        workspaceId: string,
        conversationId: string,
        memberId: string,
        user: User,
    ): Promise<void> {
        const conversation: Conversation = await this.model.findOne({ _id: conversationId });

        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        const { members } = conversation;

        const removedMember = members.find((existingMember) => existingMember.id == memberId);
        const adminMember = members.find((existingMember) => existingMember.id == user._id);

        if (removedMember?.disabled) {
            throw Exceptions.MEMBER_ALREADY_DISABLED;
        }

        if (!adminMember) {
            throw Exceptions.MEMBER_NOT_IN_CONVERSATION;
        }

        if (adminMember.id === removedMember.id) {
            throw Exceptions.MEMBER_WITHOUT_PERMISSION;
        }

        await this.updateRaw(
            {
                _id: conversationId,
                'members.id': memberId,
            },
            {
                $set: {
                    'members.$.disabled': true,
                },
            },
        );

        const activityRequestDto: ActivityDto = {
            type: ActivityType.member_removed_by_admin,
            from: adminMember,
            to: removedMember,
            data: {
                id: removedMember.id,
                name: removedMember.name,
            },
        };
        await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));

        this.publishMemberUpdatedEvent(conversationId);
    }

    /**
     * Disabilita um membro na conversa e envia a activity correspondente a essa ação
     * @param conversationId
     * @param memberId
     */
    @CatchError()
    private async disableMember(conversationId: string, memberId: string) {
        await this.updateRaw(
            {
                _id: conversationId,
                'members.id': memberId,
            },
            {
                $set: {
                    'members.$.disabled': true,
                },
            },
        );
        const conversation = await this.model.findOne({ _id: conversationId });
        const existingMember = conversation.members.find((existingMember) => existingMember.id == memberId);
        const activityRequestDto: ActivityDto = {
            type: ActivityType.member_exit,
            from: existingMember,
            to: existingMember,
        };
        await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
    }

    /**
     * Habilita um membro que ja exista na conversa e envia a activity correspondente a essa ação
     * @param conversationId
     * @param memberId
     */
    @CatchError()
    private async enableMember(conversationId: string, memberId: string) {
        const conversation = await this.model.findOne({ _id: conversationId });
        const existingMember = conversation.members.find((existingMember) => existingMember.id == memberId);
        if (existingMember) {
            await this.updateRaw(
                {
                    _id: conversationId,
                    'members.id': memberId,
                },
                {
                    $set: {
                        'members.$.disabled': false,
                    },
                },
            );
            const activityRequestDto: ActivityDto = {
                type: ActivityType.member_reconnected,
                from: existingMember,
                to: existingMember,
            };
            await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
        }
    }

    /**
     * atualiza um membro que ja exista na conversa
     * @param conversationId
     * @param memberId
     */
    @CatchError()
    async updateMember(conversationId: string, member: Identity) {
        try {
            await this.updateRaw(
                {
                    _id: conversationId,
                    'members.id': member.id,
                },
                {
                    $set: {
                        'members.$': member,
                    },
                },
            );
        } catch (e) {
            console.log('updateMember', member);
            throw e;
        }
    }

    @CatchError()
    async updateMemberWithContact(conversationId: string, member: Partial<Identity>) {
        await this.updateRaw(
            {
                _id: conversationId,
                'members.id': member.id,
            },
            // apenas estes campos que são atualizados no membro a partir do contato
            {
                $set: {
                    'members.$.name': member.name,
                    'members.$.contactId': member.contactId,
                    'members.$.avatar': member.avatar,
                },
            },
        );

        const conversation = await this.model.findOne({ _id: conversationId });

        this.channelLiveAgentService.dispatchSocket(conversation, {
            message: {
                members: conversation.members,
                workspaceId: conversation.workspace._id,
                _id: conversationId,
            },
            type: KissbotSocketType.CONVERSATION_MEMBERS_UPDATED,
        });
    }

    /**
     * Habilita um membro do tipo bot que ja exista na conversa e envia a activity correspondente a essa ação
     * @param conversationId
     * @param memberId
     */
    @CatchError()
    private async enableBot(conversationId: string) {
        const conversation = await this.model.findOne({ _id: conversationId });
        const botMember = conversation.members.find((existingMember) => existingMember.type == IdentityType.bot);
        if (botMember) {
            await this.updateRaw(
                {
                    _id: conversationId,
                    'members.id': botMember.id,
                },
                {
                    $set: {
                        'members.$.disabled': true,
                    },
                },
            );
            const activityRequestDto: ActivityDto = {
                type: ActivityType.bot_took_on,
                from: botMember,
                to: botMember,
            };
            await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
        }
    }

    @CatchError()
    public async viewConversation(
        workspaceId: string,
        conversationId: string,
        memberId: string,
        viewedDto: any,
    ): Promise<void> {
        const conversation = await this.findOne({ _id: conversationId });

        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        if (!conversation.seenBy) {
            conversation.seenBy = {};
        }
        if (viewedDto.viewed) {
            conversation.seenBy[memberId] = new Date().toISOString();
        } else {
            conversation.seenBy[memberId] = new Date(2000, 12).toISOString();
        }

        await this.updateRaw(
            {
                _id: conversation._id,
            },
            {
                seenBy: conversation.seenBy,
            },
        );
    }

    @CatchError()
    private async getQueryPermissionTeam(user: User, workspaceId: string) {
        // retorna uma query dos times que o usuario faz parte, para não acessar atendimentos de times que ele não faz parte

        // @todo deveria levar em consideração as permissões que o usuario possui dentro do time também,
        // mas não foi implementado pois vai afetar o comportamento que existe hoje.
        // Deve ser implementado no futuro quando mudar a colection conversation para o postgres.
        let query: FilterQuery<Conversation> = {};
        const isAnyAdmin = isAnySystemAdmin(user) || isWorkspaceAdmin(user, workspaceId);

        if (isAnyAdmin) {
            return query;
        }

        const defaultTeams = await this.teamService.getAllTeamsByWorkspaceAndUser(
            workspaceId,
            castObjectIdToString(user._id),
        );
        const defaultTeamsIds = defaultTeams.map((team) => team._id);

        query = {
            ...query,
            $or: [
                {
                    assignedToTeamId: { $in: defaultTeamsIds as string[] },
                },
                {
                    assignedToTeamId: { $eq: null },
                },
            ],
        };

        return query;
    }

    @CatchError()
    public async getConversationHistoryByContactId(
        user: User,
        workspaceId: string,
        contactId: string,
        skip: number,
    ): Promise<PaginatedModel<Partial<Conversation>>> {
        const newQuery = {
            $and: [
                {
                    'workspace._id': workspaceId,
                    'members.contactId': contactId,
                },
            ],
        };
        const query = {
            projection: { _id: 1, createdAt: 1, tags: 1, state: 1, createdbyChannel: 1, iid: 1 },
            sort: { createdAt: -1 },
            skip: skip,
            limit: 20,
            filter: newQuery,
        };

        return await this.queryPaginate(query, 'CONVERSATION_GET_ALL', false, true);
    }

    @CatchError()
    public async _queryPaginate(query: any, user: User, workspaceId) {
        if (query.filter?.iid?.$exists) {
            delete query.filter?.iid;
        }

        if (query.filter?._id?.$in && isArray(query.filter?._id?.$in)) {
            query.filter._id.$in = query.filter?._id?.$in.filter(
                (id: string) => typeof id === 'string' && id.length === 24,
            );
        }

        if (query.filter?.iid && typeof query.filter.iid == 'string') {
            query.filter.iid = query.filter.iid.replace(/\D/g, '');
        }

        if (query.filter._id == null || typeof query.filter._id == 'number') {
            delete query.filter._id;
        }

        if (!query.filter.$and) {
            query.filter.$and = [];
        }

        if (!!query.filter?.$and && isArray(query.filter?.$and)) {
            const hasSuspended = query.filter?.$and?.[0]?.$and?.find((cond) => !!cond?.suspendedUntil);

            if (hasSuspended && hasSuspended.suspendedUntil && typeof hasSuspended.suspendedUntil['$gte'] == 'number') {
                query.filter['state'] = ConversationStatus.open;
            }
        }

        const tabFiltersQuery = await this.getTabFilters(user, workspaceId);

        if (!query.filter.tab || query.filter.tab === ConversationTabFilter.all) {
            query.filter.$and = [tabFiltersQuery[ConversationTabFilter.all], ...(query.filter.$and || [])];
        } else {
            query.filter.$and = [tabFiltersQuery?.[query.filter.tab] ?? {}, ...(query.filter.$and || [])];
        }

        delete query.filter.tab;

        try {
            const result: any = await this.queryPaginate(query, 'CONVERSATION_GET_ALL', true, true);

            const conversationWithActivitiesPromises = result.data.map(async (conversation) => {
                conversation = conversation.toJSON({ minimize: false });

                const activities = await this.getConversationActivities(conversation);
                const attributes = await this.conversationAttributesService.getConversationAttributes(conversation._id);
                const attachments = await this.attachmentService.getAttachmentsByConversationId(conversation._id);
                conversation.activities = activities;
                conversation.fileAttachments = (attachments || []).map((att) => ({
                    contentUrl: att.attachmentLocation,
                    memberId: att.memberId,
                    mimeType: att.mimeType,
                    name: att.name,
                    timestamp: att.timestamp,
                    _id: att._id,
                }));
                conversation.attributes = attributes?.data || [];
                conversation.activities = activities;
                conversation.audioTranscriptions = [];
                return conversation;
            });

            const conversations = await Promise.all(conversationWithActivitiesPromises);
            result.data = conversations;
            result.query = query?.filter || {};
            return result;
        } catch (e) {
            console.log('ConversationService._queryPaginate', JSON.stringify(query), e);
        }
    }

    async getTabFiltersOld(user: User, workspaceId: string, onlyCountTab?: boolean) {
        const queries: { [key: string]: FilterQuery<Conversation> } = {};

        const workspaceAdmin = isWorkspaceAdmin(user, workspaceId);
        const isAnyAdmin = isAnySystemAdmin(user);

        const teams = await this.teamService.getTeamsByWorkspaceAndUser(workspaceId, castObjectIdToString(user._id));
        const teamsIds = teams.map((team) => team._id);

        const teamsCanViewOpenConversations = await this.teamService.getTeamsOneUserCanViewOpenTeamConversations(
            workspaceId,
            castObjectIdToString(user._id),
        );
        const teamsCanViewOpenConversationsIds = teamsCanViewOpenConversations.map((team) => team._id);
        const teamsCanViewFinishedConversations = await this.teamService.getUserTeamPermissions(
            workspaceId,
            castObjectIdToString(user._id),
            TeamPermissionTypes.canViewFinishedConversations,
        );
        const teamsCanViewFinishedConversationsIds = teamsCanViewFinishedConversations.map((team) => team._id);
        const optionalOrConditionFinishedConversations = [];
        if (teamsCanViewFinishedConversationsIds.length) {
            optionalOrConditionFinishedConversations.push({
                assignedToTeamId: { $in: teamsCanViewFinishedConversationsIds as string[] },
                'members.type': IdentityType.agent,
                state: ConversationStatus.closed,
            });
        }
        const teamsCanViewHistoricConversations = await this.teamService.getUserTeamPermissions(
            workspaceId,
            castObjectIdToString(user._id),
            TeamPermissionTypes.canViewHistoricConversation,
        );
        const optionalOrConditionHistoricCoversation = [];

        if (teamsCanViewHistoricConversations.length) {
            const teamsCanViewHistoricConversationsIds = teamsCanViewHistoricConversations.map((team) => team._id);

            optionalOrConditionHistoricCoversation.push({
                assignedToTeamId: { $in: teamsCanViewHistoricConversationsIds as string[] },
                state: ConversationStatus.closed,
            });
        }

        if (!teamsCanViewOpenConversationsIds) {
            queries[ConversationTabFilter.all] = {
                'workspace._id': workspaceId,
                $or: [
                    {
                        assignedToTeamId: { $in: teamsIds as string[] },
                        'members.type': { $ne: IdentityType.agent },
                    },
                    {
                        members: {
                            $elemMatch: {
                                id: user._id as string,
                                disabled: false,
                            },
                        },
                    },
                    ...optionalOrConditionFinishedConversations,
                    ...optionalOrConditionHistoricCoversation,
                ],
            };
        } else {
            const isSameTeams =
                teamsCanViewOpenConversationsIds != null &&
                teamsIds != null &&
                isEqual(teamsCanViewOpenConversationsIds.sort(), teamsIds.sort());
            if (isSameTeams) {
                queries[ConversationTabFilter.all] = {
                    'workspace._id': workspaceId,
                    $or: [
                        {
                            assignedToTeamId: { $in: teamsIds as string[] },
                        },
                        {
                            members: {
                                $elemMatch: {
                                    id: user._id as string,
                                    disabled: false,
                                },
                            },
                        },
                        ...optionalOrConditionFinishedConversations,
                        ...optionalOrConditionHistoricCoversation,
                    ],
                };
            } else {
                const optionalOrCondition = [];
                if (teamsCanViewOpenConversationsIds.length) {
                    optionalOrCondition.push({
                        assignedToTeamId: { $in: teamsCanViewOpenConversationsIds as string[] },
                        'members.type': IdentityType.agent,
                    });
                }
                if (teamsCanViewFinishedConversationsIds.length) {
                    optionalOrCondition.push({
                        assignedToTeamId: { $in: teamsCanViewFinishedConversationsIds as string[] },
                        'members.type': IdentityType.agent,
                        state: ConversationStatus.closed,
                    });
                }
                queries[ConversationTabFilter.all] = {
                    'workspace._id': workspaceId,
                    $or: [
                        {
                            assignedToTeamId: { $in: teamsIds as string[] },
                            'members.type': { $ne: IdentityType.agent },
                        },
                        ...optionalOrCondition,
                        ...optionalOrConditionHistoricCoversation,
                        {
                            members: {
                                $elemMatch: {
                                    id: user._id as string,
                                    disabled: false,
                                },
                            },
                        },
                    ],
                };
            }
        }

        queries[ConversationTabFilter.awaitAgent] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            assignedToTeamId: { $in: teamsIds as string[] },
            $or: [
                {
                    members: {
                        $elemMatch: {
                            type: { $eq: IdentityType.bot },
                            disabled: { $eq: true },
                        },
                    },
                },
                {
                    createdByChannel: ChannelIdConfig.liveagent,
                },
            ],
            members: {
                $not: {
                    $elemMatch: {
                        type: IdentityType.agent,
                        disabled: false,
                    },
                },
            },
        };

        queries[ConversationTabFilter.teams] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            assignedToTeamId: { $in: teamsCanViewOpenConversationsIds as string[] },
            $and: [
                {
                    members: {
                        $not: {
                            $elemMatch: {
                                id: user._id as string,
                                disabled: false,
                            },
                        },
                    },
                },
                {
                    members: {
                        $elemMatch: {
                            type: IdentityType.agent,
                            disabled: false,
                        },
                    },
                },
            ],
            $or: [
                { createdByChannel: ChannelIdConfig.liveagent },
                {
                    members: {
                        $elemMatch: {
                            type: IdentityType.bot,
                            disabled: true,
                        },
                    },
                },
            ],
        };

        queries[ConversationTabFilter.inbox] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            $or: [
                { isWithSmtRe: { $exists: false } },
                { isWithSmtRe: null },
                { isWithSmtRe: undefined },
                { isWithSmtRe: false },
            ],
            members: {
                $elemMatch: {
                    id: user._id as string,
                    disabled: false,
                },
            },
        };

        queries[ConversationTabFilter.smt_re] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            isWithSmtRe: { $eq: true },
        };

        queries[ConversationTabFilter.bot] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            createdByChannel: {
                $nin: [
                    ChannelIdConfig.confirmation,
                    ChannelIdConfig.reminder,
                    ChannelIdConfig.recover_lost_schedule,
                    ChannelIdConfig.nps_score,
                ],
            },
            members: {
                $elemMatch: {
                    type: IdentityType.bot,
                    disabled: { $ne: true },
                },
            },
        };

        // override if admin
        if (workspaceAdmin || isAnyAdmin) {
            delete queries[ConversationTabFilter.teams].assignedToTeamId;
            delete queries[ConversationTabFilter.awaitAgent].assignedToTeamId;

            queries[ConversationTabFilter.all] = {
                'workspace._id': workspaceId,
            };
        }

        if (onlyCountTab) {
            queries[ConversationTabFilter.inbox] = {
                ...queries[ConversationTabFilter.inbox],
                waitingSince: { $gt: 0 },
            };

            queries[ConversationTabFilter.teams] = {
                ...queries[ConversationTabFilter.teams],
                waitingSince: { $gt: 0 },
            };
        }

        return queries;
    }

    async getTabFiltersNew(user: User, workspaceId: string, onlyCountTab?: boolean) {
        const queries: { [key: string]: FilterQuery<Conversation> } = {};
        const isAnyAdmin = isAnySystemAdmin(user) || isWorkspaceAdmin(user, workspaceId);

        queries[ConversationTabFilter.awaitAgent] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            $or: [
                {
                    members: {
                        $elemMatch: {
                            type: { $eq: IdentityType.bot },
                            disabled: { $eq: true },
                        },
                    },
                },
                {
                    createdByChannel: ChannelIdConfig.liveagent,
                },
            ],
            members: {
                $not: {
                    $elemMatch: {
                        type: IdentityType.agent,
                        disabled: false,
                    },
                },
            },
        };

        queries[ConversationTabFilter.teams] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            $and: [
                {
                    members: {
                        $not: {
                            $elemMatch: {
                                id: user._id as string,
                                disabled: false,
                            },
                        },
                    },
                },
                {
                    members: {
                        $elemMatch: {
                            type: IdentityType.agent,
                            disabled: false,
                        },
                    },
                },
            ],
            $or: [
                { createdByChannel: ChannelIdConfig.liveagent },
                {
                    members: {
                        $elemMatch: {
                            type: IdentityType.bot,
                            disabled: true,
                        },
                    },
                },
            ],
        };

        queries[ConversationTabFilter.inbox] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            $or: [
                { isWithSmtRe: { $exists: false } },
                { isWithSmtRe: null },
                { isWithSmtRe: undefined },
                { isWithSmtRe: false },
            ],
            members: {
                $elemMatch: {
                    id: user._id as string,
                    disabled: false,
                },
            },
        };

        queries[ConversationTabFilter.smt_re] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            isWithSmtRe: { $eq: true },
        };

        queries[ConversationTabFilter.bot] = {
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
            createdByChannel: {
                $nin: [
                    ChannelIdConfig.confirmation,
                    ChannelIdConfig.reminder,
                    ChannelIdConfig.recover_lost_schedule,
                    ChannelIdConfig.nps_score,
                ],
            },
            assignedToTeamId: { $eq: null },
            members: {
                $elemMatch: {
                    type: IdentityType.bot,
                    disabled: { $ne: true },
                },
            },
        };

        queries[ConversationTabFilter.all] = {
            'workspace._id': workspaceId,
        };

        if (!isAnyAdmin) {
            const defaultTeams = await this.teamService.getTeamsByWorkspaceAndUser(
                workspaceId,
                castObjectIdToString(user._id),
            );
            const defaultTeamsIds = defaultTeams.map((team) => team._id);

            const teamsCanViewFinishedConversations = await this.teamService.getUserTeamPermissions(
                workspaceId,
                castObjectIdToString(user._id),
                TeamPermissionTypes.canViewFinishedConversations,
            );
            const teamsCanViewFinishedConversationsIds = teamsCanViewFinishedConversations.map((team) => team._id);

            // -- Início condição para times histórico
            const historicTeamsOrCondition = [];
            const workspace = await this.workspacesService.getOne(workspaceId);
            if (!!workspace?.generalConfigs?.enableAgentsTeamHistoryAccess) {
                historicTeamsOrCondition.push({
                    assignedToTeamId: { $exists: true, $ne: null },
                    state: ConversationStatus.closed,
                });
            } else {
                const teamsCanViewOnlyHistoric = await this.teamService.getUserTeamPermissions(
                    workspaceId,
                    castObjectIdToString(user._id),
                    TeamPermissionTypes.canViewHistoricConversation,
                );

                if (teamsCanViewOnlyHistoric.length) {
                    const teamsCanViewHistoricConversationsIds = teamsCanViewOnlyHistoric.map((team) => team._id);

                    historicTeamsOrCondition.push({
                        assignedToTeamId: { $in: teamsCanViewHistoricConversationsIds as string[] },
                        state: ConversationStatus.closed,
                    });
                }
            }

            // -- Fim condição para times histórico

            const teamsCanViewOpenConversations = await this.teamService.getTeamsOneUserCanViewOpenTeamConversations(
                workspaceId,
                castObjectIdToString(user._id),
            );
            const teamsCanViewOpenConversationsIds = teamsCanViewOpenConversations.map((team) => team._id);
            const optionalOrCondition = [];

            const canViewConversationsWithAgent = [];
            const canViewConversationsWithoutAgent = [];
            const validTeamsCanViewFinishedConversationsIds = [];

            const optionalMemberId =
                // precisa daqui pois se a pessoa n tem permissao para ver aberto de outros e nem encerrados
                // precisa ver pelo menos os dele
                {
                    assignedToTeamId: { $in: defaultTeamsIds as string[] },
                    'members.id': { $eq: user._id as string },
                };

            defaultTeamsIds.forEach((teamId) => {
                const teamIdOnCanViewPermission = teamsCanViewOpenConversationsIds.find((teamIdCanViewId) => {
                    return castObjectIdToString(teamIdCanViewId) === castObjectIdToString(teamId);
                });

                if (teamIdOnCanViewPermission) {
                    canViewConversationsWithAgent.push(teamId);
                } else {
                    canViewConversationsWithoutAgent.push(teamId);
                }
            });

            const sameTeamsIdsFinishedOrCanViewOpen = [];

            teamsCanViewOpenConversationsIds.forEach((teamIdCanViewId) => {
                const teamIdOnCanViewPermission = teamsCanViewFinishedConversationsIds.find(
                    (teamsCanViewFinishedId) => {
                        return castObjectIdToString(teamIdCanViewId) === castObjectIdToString(teamsCanViewFinishedId);
                    },
                );

                if (teamIdOnCanViewPermission) {
                    sameTeamsIdsFinishedOrCanViewOpen.push(teamIdCanViewId);
                }
            });

            if (teamsCanViewFinishedConversationsIds.length && sameTeamsIdsFinishedOrCanViewOpen.length) {
                validTeamsCanViewFinishedConversationsIds.push(
                    ...difference(
                        teamsCanViewFinishedConversationsIds.map((i) => castObjectIdToString(i)),
                        sameTeamsIdsFinishedOrCanViewOpen.map((i) => castObjectIdToString(i)),
                    ),
                );
            } else if (teamsCanViewFinishedConversationsIds.length) {
                validTeamsCanViewFinishedConversationsIds.push(...teamsCanViewFinishedConversationsIds);
            }

            // se for tudo igual nas permissoes, lança apenas um assignedToTeamId geral
            const allTeamsSamePermission =
                canViewConversationsWithAgent.length === defaultTeamsIds.length &&
                teamsCanViewFinishedConversationsIds.length === defaultTeamsIds.length &&
                isEqual(canViewConversationsWithAgent.sort(), defaultTeamsIds.sort()) &&
                isEqual(teamsCanViewFinishedConversationsIds.sort(), defaultTeamsIds.sort());

            if (allTeamsSamePermission) {
                optionalOrCondition.push({
                    assignedToTeamId: { $in: canViewConversationsWithAgent as string[] },
                });
                // aqui o usuario tem permissoes diferentes para cada time
            } else if (canViewConversationsWithoutAgent.length && canViewConversationsWithAgent.length) {
                optionalOrCondition.push(
                    ...[
                        {
                            assignedToTeamId: { $in: canViewConversationsWithoutAgent as string[] },
                            'members.type': { $ne: IdentityType.agent },
                            state: ConversationStatus.open,
                        },
                    ],
                    optionalMemberId,
                    // a regra aqui é assumidos por outros membros (canViewOpenTeamConversations), nao necessariamente abertos ou fechados
                    // a regra sobrescreve a permissão canViewFinishedConversations, pois se pode ver atendimentos de outros membros deve ver os encerrados também
                    {
                        assignedToTeamId: { $in: canViewConversationsWithAgent as string[] },
                        'members.type': { $eq: IdentityType.agent },
                    },
                );
                // se pode ver conversas abertas de todos os times, cai aqui
            } else if (canViewConversationsWithAgent.length) {
                const newCanViewConversationsWithAgent = [];

                if (sameTeamsIdsFinishedOrCanViewOpen.length) {
                    // só adiciona a diferença do que nào tem permissao de ver historico
                    newCanViewConversationsWithAgent.push(
                        ...difference(
                            canViewConversationsWithAgent.map((i) => i.toHexString()),
                            sameTeamsIdsFinishedOrCanViewOpen.map((i) => i.toHexString()),
                        ),
                    );
                } else {
                    newCanViewConversationsWithAgent.push(...canViewConversationsWithAgent);
                }

                optionalOrCondition.push(
                    ...[
                        {
                            assignedToTeamId: { $in: newCanViewConversationsWithAgent as string[] },
                            'members.type': { $eq: IdentityType.agent },
                        },
                        optionalMemberId,
                    ],
                );

                // se tiver id aqui significa que algum time tem permissao para ver abertas e finalizadas
                // que é igual a ver tudo
                if (sameTeamsIdsFinishedOrCanViewOpen.length) {
                    optionalOrCondition.push({
                        assignedToTeamId: { $in: sameTeamsIdsFinishedOrCanViewOpen as string[] },
                    });
                }

                // padrão caso tudo de errado
            } else if (defaultTeamsIds.length) {
                optionalOrCondition.push(
                    ...[
                        {
                            assignedToTeamId: { $in: defaultTeamsIds as string[] },
                            'members.type': { $ne: IdentityType.agent },
                            state: ConversationStatus.open,
                        },
                        optionalMemberId,
                    ],
                );
            }

            // aqui so vai ids de times que nao estao na regra de canViewOpenTeamConversations
            // a regra diz canViewOpenTeamConversations mas acho que nunca filtrou por aberto
            // se for deixar como o nome esse if muda e o de cima tem que ter um state: open
            if (!allTeamsSamePermission) {
                if (validTeamsCanViewFinishedConversationsIds.length) {
                    optionalOrCondition.push({
                        assignedToTeamId: { $in: validTeamsCanViewFinishedConversationsIds as string[] },
                        state: ConversationStatus.closed,
                    });
                }
            }

            queries[ConversationTabFilter.all] = {
                'workspace._id': workspaceId,
                $or: [],
            };

            if (optionalOrCondition.length) {
                queries[ConversationTabFilter.all].$or.push(...optionalOrCondition);
            }

            if (historicTeamsOrCondition.length) {
                queries[ConversationTabFilter.all].$or.push(...historicTeamsOrCondition);
            }

            queries[ConversationTabFilter.teams] = {
                assignedToTeamId: { $in: teamsCanViewOpenConversationsIds as string[] },
                ...queries[ConversationTabFilter.teams],
            };

            queries[ConversationTabFilter.awaitAgent] = {
                assignedToTeamId: { $in: defaultTeamsIds as string[] },
                ...queries[ConversationTabFilter.awaitAgent],
            };
        }

        if (onlyCountTab) {
            queries[ConversationTabFilter.inbox] = {
                ...queries[ConversationTabFilter.inbox],
                waitingSince: { $gt: 0 },
            };

            queries[ConversationTabFilter.teams] = {
                ...queries[ConversationTabFilter.teams],
                waitingSince: { $gt: 0 },
            };
        }

        return queries;
    }

    @CatchError()
    public async getTabFilters(user: User, workspaceId: string, onlyCountTab?: boolean) {
        return await this.getTabFiltersNew(user, workspaceId, onlyCountTab);
        // return await this.getTabFiltersOld(user, workspaceId, onlyCountTab);
    }

    @CatchError()
    public async updateMembersWithContactModel(
        conversationList: Conversation[],
        contact: IContactCreate,
        contactId: string,
    ) {
        const toUpdateArr = [];

        conversationList.forEach((conversation: Conversation) => {
            const memberIndex = conversation.members.findIndex(
                (member) => contactId == member.contactId || member.type === IdentityType.user,
            );

            if (memberIndex === -1) {
                return;
            }

            const replacedContactToMember = {
                ...(conversation.members?.[memberIndex] as any)?.toJSON({ minimize: false }),
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
            } as Identity;

            toUpdateArr.push(
                this.updateRaw(
                    { _id: conversation._id },
                    {
                        $set: {
                            ...{ [`members.${memberIndex}`]: replacedContactToMember },
                        },
                    },
                ),
            );
        });

        await Promise.all(toUpdateArr);

        const conversationIds = conversationList.map((conversation) => conversation._id);
        const updatedConversations = await this.getAll({
            _id: { $in: [...conversationIds] },
        });

        if (updatedConversations?.length) {
            updatedConversations.map((conversation) => {
                this.channelLiveAgentService.dispatchSocket(conversation, {
                    message: conversation,
                    type: KissbotSocketType.CONVERSATION_UPDATED,
                });

                const member = conversation.members.find(
                    (member) => contactId == member.contactId || member.type === IdentityType.user,
                );

                this.eventsService.sendEvent({
                    data: {
                        _id: conversation._id,
                        members: [member],
                        workspaceId: conversation.workspace._id,
                    },
                    dataType: KissbotEventDataType.CONVERSATION,
                    source: KissbotEventSource.KISSBOT_API,
                    type: KissbotEventType.CONVERSATION_MEMBER_UPDATED,
                });
            });
        }
    }

    @CatchError()
    private async publishMemberUpdatedEvent(conversationId: string) {
        const updatedConversation = await this.model.findOne({ _id: conversationId });
        this.eventsService.sendEvent({
            data: {
                members: updatedConversation.members,
                workspaceId: updatedConversation.workspace._id,
                teamId: updatedConversation.assignedToTeamId,
                _id: conversationId,
            },
            dataType: KissbotEventDataType.CONVERSATION,
            source: KissbotEventSource.CONVERSATION_MANAGER,
            type: KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
        });
    }

    @CatchError()
    async updateMemberContactId(conversationId: string, member: Identity) {
        if (member.contactId) {
            await this.updateRaw(
                {
                    _id: conversationId,
                    'members.id': { $eq: member.id },
                },
                {
                    'members.$.contactId': member.contactId,
                },
            );
        }
    }

    @CatchError()
    async addTags(conversationId: string, newTags: any[]) {
        for (const tag of newTags) {
            if (!tag._id) {
                tag._id = new Types.ObjectId();
            }
            await this.updateRaw(
                {
                    _id: conversationId,
                    'tags.name': { $ne: tag.name },
                },
                {
                    $addToSet: {
                        tags: tag,
                    },
                },
            );
        }

        const updatedConversation = await this.model.findOne({ _id: conversationId });

        this.eventsService.sendEvent({
            data: {
                tags: updatedConversation.tags,
                conversationId,
            },
            dataType: KissbotEventDataType.CONVERSATION,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONVERSATION_TAGS_UPDATE,
        });

        this.channelLiveAgentService.dispatchSocket(updatedConversation, {
            message: {
                tags: updatedConversation.tags,
                conversationId,
            },
            type: KissbotSocketType.CONVERSATION_TAGS_UPDATED,
        });

        return updatedConversation.tags;
    }

    @CatchError()
    async createTag(workspaceId: string, conversationId: string, newTag: any): Promise<void> {
        const conversation = await this.findOne({ _id: conversationId });

        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        await this.updateRaw(
            {
                _id: conversation._id,
                'tags.name': { $ne: newTag.name },
            },
            {
                $addToSet: {
                    tags: newTag,
                },
            },
        );

        const updatedConversation = await this.model.findOne({ _id: conversationId });

        this.eventsService.sendEvent({
            data: {
                tags: updatedConversation.tags,
                conversationId,
            },
            dataType: KissbotEventDataType.CONVERSATION,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.CONVERSATION_TAGS_UPDATE,
        });

        this.channelLiveAgentService.dispatchSocket(updatedConversation, {
            message: {
                tags: updatedConversation.tags,
                conversationId,
            },
            type: KissbotSocketType.CONVERSATION_TAGS_UPDATED,
        });
    }

    @CatchError()
    async deleteTag(workspaceId: string, conversationId: string, tagId: string): Promise<void> {
        const conversation = await this.model.findOne({ _id: conversationId });

        if (conversation) {
            if (conversation.workspace._id !== workspaceId) {
                throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
            }

            const tag = conversation.tags.find((currTag) => {
                return castObjectId(currTag._id).equals(tagId);
            });
            if (!tag) return;

            await this.updateRaw(
                {
                    _id: conversationId,
                },
                {
                    $pull: {
                        tags: {
                            name: tag.name,
                        },
                    },
                },
            );

            const updatedConversation = await this.model.findOne({ _id: conversationId });

            this.eventsService.sendEvent({
                data: {
                    tags: updatedConversation.tags,
                    conversationId,
                },
                dataType: KissbotEventDataType.CONVERSATION,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.CONVERSATION_TAGS_UPDATE,
            });

            this.channelLiveAgentService.dispatchSocket(updatedConversation, {
                message: {
                    tags: updatedConversation.tags,
                    conversationId,
                },
                type: KissbotSocketType.CONVERSATION_TAGS_UPDATED,
            });
        }
    }

    @CatchError()
    public async getConversationsByPhoneAndWorkspace(phoneNumber: string, workspaceId: string) {
        const otherNumber: string = convertPhoneNumber(phoneNumber);

        let conversations: Array<Conversation> = null;

        if (phoneNumber != otherNumber) {
            conversations = await this.model.find({
                $and: [
                    { 'workspace._id': workspaceId },
                    {
                        $or: [{ 'members.phone': otherNumber }, { 'members.phone': phoneNumber }],
                    },
                ],
            });
        } else {
            conversations = await this.model.find({
                $and: [
                    {
                        'workspace._id': workspaceId,
                    },
                    {
                        'members.phone': otherNumber,
                    },
                ],
            });
        }

        const conversationWithActivitiesPromises = conversations.map(async (conversation) => {
            const leanConversation: any = conversation.toJSON({ minimize: false });
            const activities = await this.activityService
                .getModel()
                .find({ conversationId: conversation._id, type: ActivityType.message })
                .limit(1)
                .sort({ timestamp: -1 })
                .exec();
            leanConversation.activities = activities || [];
            return leanConversation;
        });
        const conversationsWithActivities = await Promise.all(conversationWithActivitiesPromises);
        return conversationsWithActivities;
    }

    @CatchError()
    async hasOpenedConversationByPhoneNumberAndWorkspaceId(phoneNumber: string, workspaceId: string): Promise<boolean> {
        const phones = getWithAndWithout9PhoneNumber(getCompletePhone(phoneNumber));
        const conversationsCnt = await this.model.countDocuments({
            $and: [
                {
                    state: ConversationStatus.open,
                    'workspace._id': workspaceId,
                },
                {
                    $or: [{ 'members.id': phones[0] }, { 'members.id': phones[1] }],
                },
            ],
        });

        return conversationsCnt > 0;
    }

    @CatchError()
    private async contactHasConversation(contactId: string, channelConfig: Partial<ChannelConfig>) {
        const contact = await this.contactService.getContact(channelConfig.workspaceId, contactId);
        if (!contact || !contact?.conversations?.length) {
            return [];
        }

        const phones = getWithAndWithout9PhoneNumber(getCompletePhone(contact.phone, contact?.ddi));
        const phoneConditions = [...new Set(phones)].map((phone) => ({ phone }));

        const conversations = await this.getAll({
            _id: { $in: [...contact.conversations] },
            members: {
                $elemMatch: {
                    $or: phoneConditions,
                    channelId: channelConfig.channelId,
                },
            },
            token: channelConfig.token,
            state: ConversationStatus.open,
        });

        return conversations;
    }

    @CatchError()
    public async createChannelConversation(liveAgentConversation: ChannelConversationStart, userAuth: User) {
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(liveAgentConversation.channelConfigId);

        if (!channelConfig) {
            throw Exceptions.INVALID_CHANNELCONFIG;
        }

        switch (channelConfig.channelId) {
            case ChannelIdConfig.whatsweb:
            case ChannelIdConfig.gupshup:
                const conversation = await this.createWhatsAppConversation(
                    liveAgentConversation,
                    userAuth,
                    channelConfig,
                    liveAgentConversation.contactId ?? undefined,
                );

                return conversation;
            default:
                throw new NotImplementedException('not implemented for this channel');
        }
    }

    getChannelConfigPrivateData(channelConfig: Partial<ChannelConfig>) {
        switch (channelConfig.channelId) {
            case ChannelIdConfig.gupshup: {
                return {
                    phoneNumber: channelConfig?.configData?.phoneNumber,
                    apikey: channelConfig?.configData?.apikey,
                    gupshupAppName: channelConfig?.configData?.appName,
                };
            }
        }
    }

    @CatchError()
    private async getOpenedConversationsByPhoneNumber(
        phone: string,
        channelId: string,
        workspaceId: string,
        channelToken: string,
        ddi?: string,
    ) {
        const phones = getWithAndWithout9PhoneNumber(getCompletePhone(phone, ddi));
        const phoneConditions = [...new Set(phones)].map((phone) => ({ phone }));
        const memberIdConditions = [...new Set(phones)].map((phone) => ({ id: phone }));
        return await this.getAll({
            members: {
                $elemMatch: {
                    $or: [...phoneConditions, ...memberIdConditions],
                    channelId: channelId,
                },
            },
            state: ConversationStatus.open,
            token: channelToken,
            'workspace._id': workspaceId,
        });
    }

    @CatchError()
    private async getOpenedConversationsByPhoneNumberList(
        phones: string[],
        channelId: string,
        workspaceId: string,
        channelToken: string,
    ) {
        return await this.getAll({
            'members.phone': { $in: phones },
            'members.channelId': channelId,
            state: ConversationStatus.open,
            token: channelToken,
            'workspace._id': workspaceId,
        });
    }

    @CatchError()
    private async createWhatsAppConversation(
        liveAgentConversation: ChannelConversationStart,
        userAuth: User,
        channelConfig: Partial<ChannelConfig> & { workspace: Partial<Workspace> },
        contactId?: string,
    ) {
        let contact: IContact;

        if (liveAgentConversation.assignedToTeamId) {
            const team = await this.teamService.findOne({
                _id: castObjectId(liveAgentConversation.assignedToTeamId),
                $or: [{ deletedAt: undefined }, { deletedAt: { $exists: true } }, { deletedAt: { $exists: false } }],
            });
            if (!team) {
                throw Exceptions.TEAM_NOT_FOUND;
            }

            // Caso time esteja inativado, lançar exceção.
            if (!!team?.inactivatedAt) {
                throw Exceptions.TEAM_INACTIVATED;
            }
        }

        // validações para tratar conversas abertas de um número / contato
        if (contactId) {
            contact = await this.contactService.getContact(channelConfig.workspaceId, contactId);
            const conversations = await this.contactHasConversation(contactId, channelConfig);

            if (conversations?.length) {
                return { exist: conversations };
            }
        } else if (liveAgentConversation.startMember?.id) {
            contact = await this.contactService.getContactByWhatsapp(
                getWhatsappPhone(liveAgentConversation.startMember.id, liveAgentConversation.startMember?.ddi),
                channelConfig.workspaceId,
            );
            const phonNumber = this.getIdMemberByWhatsappConversation(contact, liveAgentConversation);

            const conversations = await this.getOpenedConversationsByPhoneNumber(
                phonNumber,
                channelConfig.channelId,
                channelConfig.workspaceId,
                channelConfig.token,
                liveAgentConversation.startMember?.ddi,
            );

            if (conversations?.length) {
                return { exist: conversations };
            }
        } else {
            throw Exceptions.CONVERSATION_WITHOUT_DESTINATION;
        }

        if (contact?.blockedAt) {
            throw Exceptions.CANNOT_START_CONVERSATION_ON_BLOCKED_CONTACT;
        }

        let whatsappExpiration: number | undefined;

        if (channelConfig.channelId == ChannelIdConfig.gupshup) {
            const expirationSession =
                await this.whatsappSessionControlService.findSessionByWorkspaceAndNumberAndChannelConfigId(
                    channelConfig.workspaceId,
                    contact?.whatsapp ?? liveAgentConversation.startMember.id,
                    channelConfig.token,
                );
            whatsappExpiration = expirationSession?.whatsappExpiration || moment().valueOf();
        }

        const privateData = this.getChannelConfigPrivateData(channelConfig);
        const agentMember = {
            id: castObjectIdToString(userAuth._id),
            name: userAuth.name,
            channelId: ChannelIdConfig.liveagent,
            type: IdentityType.agent,
            avatar: userAuth.avatar,
            disabled: false,
            metrics: {
                assumedAt: +new Date(),
            },
        };
        const conversation = {
            createdByChannel: ChannelIdConfig.liveagent,
            token: channelConfig.token,
            hash: channelConfig.token,
            workspace: channelConfig.workspace,
            state: ConversationStatus.open,
            assignedToUserId: userAuth._id,
            assignedToTeamId: liveAgentConversation.assignedToTeamId,
            privateData,
            whatsappExpiration,
            shouldRequestRating: !!channelConfig.workspace?.featureFlag?.rating,
            members: [
                agentMember,
                {
                    id: this.getIdMemberByWhatsappConversation(contact, liveAgentConversation),
                    name: contact?.name || liveAgentConversation.startMember.name,
                    channelId: channelConfig.channelId,
                    type: IdentityType.user,
                    phone: contact?.phone || liveAgentConversation.startMember.phone,
                    contactId: contact?._id,
                    ddi: liveAgentConversation.startMember?.ddi,
                },
            ],
        };

        try {
            const createdConversation = await this._create(conversation);
            const team = await this.teamService.getOne(liveAgentConversation.assignedToTeamId);
            createdConversation.assignedToTeamId = castObjectIdToString(team._id);

            this.dispatchAssignedToTeamActivity(createdConversation, {
                userId: userAuth._id as string,
                team: team as any,
                conversationId: castObjectIdToString(createdConversation._id),
                assignedByMember: agentMember,
            });
            return createdConversation;
        } catch (error) {
            throw Exceptions.BAD_REQUEST;
        }
    }

    private getIdMemberByWhatsappConversation(
        contact: IContact,
        liveAgentConversation: ChannelConversationStart,
    ): string {
        try {
            // Caso seja iniciado pelo front com um ddi estrangeiro
            if (
                liveAgentConversation?.startMember?.phone &&
                liveAgentConversation?.startMember?.ddi &&
                liveAgentConversation?.startMember?.ddi !== '55'
            ) {
                return getWhatsappPhone(liveAgentConversation.startMember.phone, liveAgentConversation.startMember.ddi);
            }
            // Caso possua contact.whatsapp que já tem ddi cadastrado diferente de '55'
            if (contact?.whatsapp && !!contact?.ddi && contact?.ddi !== '55') {
                return contact.whatsapp;
            }
            // Caso tenha contact.whatsapp e ddi seja '55'
            if (contact?.whatsapp) {
                return getWhatsappPhone(contact.whatsapp, contact?.ddi);
            }

            return getWhatsappPhone(liveAgentConversation.startMember.id, liveAgentConversation.startMember?.ddi);
        } catch (e) {
            Sentry.captureEvent({
                message: 'ConversationService.getIdMemberByWhatsappConversation error',
                extra: {
                    contact,
                    liveAgentConversation,
                },
            });
            return getWhatsappPhone(contact?.whatsapp ?? liveAgentConversation.startMember.id);
        }
    }

    private getConversationCallbackCacheKey(channelConfigToken: string, phone: string) {
        return `CONVERSATION_CALLBACKS:${channelConfigToken}:${phone}`;
    }

    @CatchError()
    async createConversationCallbackValidation(
        _: string,
        channelConfigToken: string,
        createCallbackConversationData: ChannelCallbackConversationStart,
    ) {
        let validantingChannelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);

        // O channelconfig validador pode não ser o mesmo que tem que ser iniciada a conversa
        // nesse caso pega o primeiro channelConfig wrapper que é validador e está como LoggedIn
        if (!validantingChannelConfig.canValidateNumber) {
            validantingChannelConfig =
                (await this.channelConfigService.getCanValidateLoggedInWrapperChannelConfig()) as any;
        }

        if (validantingChannelConfig.configData?.status?.status !== 'LoggedIn') {
            throw Exceptions.CHANNEL_NOT_LOGGED;
        }

        if (!validantingChannelConfig) {
            throw Exceptions.VALIDATE_CHANNEL_CONFIG_NOT_FOUND;
        }

        const client = this.cacheService.getClient();
        const key = this.getConversationCallbackCacheKey(
            channelConfigToken,
            createCallbackConversationData.phoneNumber,
        );
        await client.set(key, JSON.stringify({ data: createCallbackConversationData, channelConfigToken }));
        await client.expire(key, 120);
        this.eventsService.sendEvent(
            {
                data: {
                    token: channelConfigToken,
                    phone: createCallbackConversationData.phoneNumber,
                    ddi: createCallbackConversationData.ddi,
                    userId: channelConfigToken,
                },
                dataType: KissbotEventDataType.WHATSWEB_CHECK_PHONE_NUMBER_REQUEST,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_REQUEST,
            },
            `${KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_REQUEST}.${validantingChannelConfig.token}`,
        );
    }

    @CatchError({ ignoreThrow: true })
    public async createConversationCallback(event: IWhatswebCheckPhoneNumberResponseEvent) {
        const channelConfigToken = event.userId;
        const client = this.cacheService.getClient();
        const key = this.getConversationCallbackCacheKey(channelConfigToken, event.phone);
        const result = await client.get(key);
        if (!result) {
            return;
        }
        await client.del(key);
        const parsedResult = JSON.parse(result);
        const createCallbackConversationData: ChannelCallbackConversationStart = parsedResult.data;
        if (!createCallbackConversationData) {
            return;
        }
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
        const workspaceId = channelConfig.workspaceId;
        const parsedNumber = event.phoneId;

        if (!channelConfig.enable) {
            console.log('ignoring send message');
            throw Exceptions.CANNOT_SEND_MESSAGE_ON_NOT_ENABLED_CHANNEL;
        }
        const contact = await this.contactService.findOne({
            whatsapp: parsedNumber,
            workspaceId: channelConfig.workspaceId,
        });

        let conversation: any = await this.findOne({
            'members.id': parsedNumber,
            'members.channelId': channelConfig.channelId,
            state: ConversationStatus.open,
            'workspace._id': channelConfig.workspaceId,
        });

        const attributes = (createCallbackConversationData.attributes || []).map((attr) => ({
            ...attr,
            type: attr.type || '@sys.any',
        }));

        if (!conversation) {
            let whatsappExpiration: number | undefined;

            if (channelConfig.channelId == ChannelIdConfig.gupshup) {
                const expirationSession =
                    await this.whatsappSessionControlService.findSessionByWorkspaceAndNumberAndChannelConfigId(
                        workspaceId,
                        parsedNumber,
                        channelConfig.token,
                    );
                whatsappExpiration = expirationSession?.whatsappExpiration || moment().valueOf();
            }

            const privateData = await this.getChannelConfigPrivateData(channelConfig);

            const bot = await this.botService.getOne(channelConfig.botId);
            const members = [];

            if (event.isValid) {
                members.push();
            }
            members.push(
                {
                    id: channelConfig.botId,
                    name: bot.name,
                    channelId: ChannelIdConfig.kissbot,
                    type: IdentityType.bot,
                    disabled: false,
                },
                {
                    channelId: 'system',
                    id: systemMemberId,
                    name: 'system',
                    type: IdentityType.system,
                },
                {
                    id: contact?.whatsapp || parsedNumber,
                    name: contact?.name || parsedNumber,
                    channelId: channelConfig.channelId,
                    type: IdentityType.user,
                    phone: contact?.phone || parsedNumber,
                    contactId: contact?._id,
                    disabled: !event.isValid,
                },
            );
            const conversationToSave = {
                createdByChannel: ChannelIdConfig.kissbot,
                token: channelConfig.token,
                hash: channelConfig.token,
                workspace: channelConfig.workspace,
                state: ConversationStatus.open,
                assignedToTeamId: createCallbackConversationData.assignedToTeamId,
                priority: createCallbackConversationData.priority,
                privateData,
                whatsappExpiration,
                attributes,
                members,
            };
            conversation = await this._create(conversationToSave);
        } else {
            if (attributes.length > 0) {
                await this.addAttributesToConversation(conversation._id, attributes);
            }
        }

        const userMember = conversation.members.find((mem) => mem.type === IdentityType.user);
        let systemMember = conversation.members.find((mem) => mem.type === IdentityType.system);
        const botMember = conversation.members.find((mem) => mem.type === IdentityType.bot && !mem.disabled);

        if (!systemMember) {
            try {
                await this.updateRaw(
                    { _id: conversation._id },
                    {
                        $addToSet: {
                            members: {
                                channelId: 'system',
                                id: systemMemberId,
                                name: 'system',
                                type: IdentityType.system,
                            },
                        },
                    },
                );
                conversation = await this.model.findOne({ _id: conversation._id });
                systemMember = conversation.members.find((mem) => mem.type === IdentityType.system);
            } catch (e) {
                console.log('error try add system member');
            }
        }
        if (userMember && botMember && createCallbackConversationData.action && !!event.isValid) {
            const activity = {
                type: ActivityType.event,
                from: userMember,
                name: createCallbackConversationData.action,
                conversationId: conversation._id,
            };
            await this.dispatchMessageActivity(conversation, activity);
        }

        if (createCallbackConversationData.text && !!event.isValid) {
            try {
                if (!createCallbackConversationData.text && createCallbackConversationData.templateId) {
                    const values = (createCallbackConversationData.attributes || []).map((attr) => {
                        return { key: attr.name, value: attr.value };
                    });
                    const text = await this.templateMessageService.getParsedTemplate(
                        createCallbackConversationData.templateId,
                        values,
                    );
                    createCallbackConversationData.text = text;
                }
            } catch (e) {
                console.log('Wrong parsed', e);
            }
            const activity: any = {
                type: ActivityType.message,
                from: systemMember,
                text: createCallbackConversationData.text,
                conversationId: conversation._id,
                templateId: createCallbackConversationData.templateId,
            };
            await this.dispatchMessageActivity(conversation, activity);
        }

        if (!event.isValid) {
            const activity: any = {
                type: ActivityType.error,
                from: systemMember,
                text: 'Número invalido',
                conversationId: conversation._id,
            };
            await this.dispatchMessageActivity(conversation, activity);
        }
    }

    @CatchError()
    async addAttributesToConversation(conversationId: string, attributes: Attribute[]): Promise<void> {
        const endTimer = rabbitMsgLatency.labels('updateWhatsappExpiration').startTimer();

        const attributeGroup = await this.conversationAttributesService.addAttributes(conversationId, attributes);
        if (!attributeGroup) {
            Sentry.captureEvent({
                message: 'ConversationService.addAttributesToConversation not find attributeGroup',
                extra: {
                    conversationId,
                    attributes,
                },
            });
            return;
        }
        this.sendAttributesToSocket(conversationId, attributeGroup.data).then();
        // await this.sendAttributesToSocket(conversationId, attributeGroup.data);

        const addedAttributes = attributeGroup.data.filter((attr) => {
            const currentAttr = attributes.find((receivedAttr) => receivedAttr.name === attr.name);
            return currentAttr;
        });

        const replacedAttributes = addedAttributes.map((attr: any) => ({
            ...(attr?.toJSON?.({ minimize: false }) ?? attr),
            _id: attributeGroup._id as string,
        }));

        this.findOne({ _id: conversationId }).then((conversation) => {
            this.eventsService.sendEvent({
                data: {
                    conversation,
                    data: replacedAttributes,
                    conversationId,
                    workspaceId: conversation.workspace._id,
                } as IConversationAddAttributeEvent,
                dataType: KissbotEventDataType.CONVERSATION,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.CONVERSATION_ATTRIBUTE_ADDED,
            });
        });
        endTimer();
    }

    @CatchError()
    async removeAttributeFromConversation(conversationId: string, attributeName: string): Promise<void> {
        const attributeGroup = await this.conversationAttributesService.removeAttribute(conversationId, attributeName);
        this.sendAttributesToSocket(conversationId, attributeGroup.data).then();
        // await this.sendAttributesToSocket(conversationId, attributeGroup.data);

        this.findOne({ _id: conversationId }).then((conversation) => {
            this.eventsService.sendEvent({
                data: {
                    _id: attributeGroup._id as string,
                    name: attributeName,
                    workspaceId: conversation.workspace._id,
                    conversationId,
                } as IConversationRemoveAttributeEvent,
                dataType: KissbotEventDataType.CONVERSATION,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.CONVERSATION_ATTRIBUTE_REMOVED,
            });
        });
    }

    @CatchError()
    async sendAttributesToSocket(conversationId: string, attributes: Attribute[]): Promise<void> {
        const conversation = await this.model.findOne({ _id: conversationId });
        this.channelLiveAgentService.dispatchSocket(conversation, {
            message: {
                attributes,
                conversationId,
            },
            type: KissbotSocketType.CONVERSATION_ATTRIBUTES_UPDATED,
        });
    }

    @CatchError()
    public async validateWhatsappByPhone(
        workspaceId: string,
        phoneNumber: string,
        ddi = '55',
        user: User,
        contactId?: string,
    ) {
        let channelConfigs = await this.channelConfigService.getModel().find({
            workspaceId,
            canStartConversation: true,
            channelId: ChannelIdConfig.gupshup,
            deletedAt: { $eq: null },
        });

        if (!channelConfigs?.length) {
            throw new BadGatewayException('Not found LoggedIn channels');
        }

        let contact: IContact;

        if (contactId) {
            contact = await this.contactService.getContact(workspaceId, contactId);
        }
        if (!contact && phoneNumber) {
            contact = await this.contactService.getContactByWhatsapp(getCompletePhone(phoneNumber, ddi), workspaceId);
        }
        const phones = contact?.phone
            ? [contact.phone, contact?.whatsapp]
            : getWithAndWithout9PhoneNumber(getCompletePhone(phoneNumber, ddi));
        const conversationByChannel = await Promise.all(
            channelConfigs.map(async (channelConfig) => {
                let conversation = await this.getConversationByMemberIdAndChannelConfig(phones[0], channelConfig.token);
                if (!conversation) {
                    conversation = await this.getConversationByMemberIdAndChannelConfig(phones[1], channelConfig.token);
                }

                return { channelConfigToken: channelConfig.token, conversation };
            }),
        );

        return { conversationByChannel, contact };
    }

    @CatchError()
    public async unreadMessages(workspaceId: string, user: User) {
        const teamsCanViewOpenConversations = await this.teamService.getTeamsOneUserCanViewOpenTeamConversations(
            workspaceId,
            castObjectIdToString(user._id),
        );
        const teamsCanViewOpenConversationsIds = teamsCanViewOpenConversations.map((team) => String(team._id));

        const query: any = [
            {
                $match: {
                    'workspace._id': workspaceId,
                    state: ConversationStatus.open,
                    assignedToTeamId: { $in: teamsCanViewOpenConversationsIds },
                },
            },
            {
                $project: {
                    _id: {
                        $toString: '$_id',
                    },
                    seenBy: 1,
                },
            },
            {
                $lookup: {
                    from: 'activity_api',
                    localField: '_id',
                    foreignField: 'conversationId',
                    as: 'activities',
                },
            },
            {
                $project: {
                    seenBy: 1,
                    activities: {
                        $filter: {
                            input: '$activities',
                            as: 'activity',
                            cond: {
                                $and: [
                                    { $in: ['$$activity.type', [...activityToUpdateTimestamp]] },
                                    {
                                        $and: [{ $gt: ['$$activity.timestamp', `$seenBy.${user._id}`] }],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            {
                $match: {
                    activities: { $exists: true, $ne: [] },
                },
            },
        ];

        const conversations = await this.model.aggregate(query);

        return {
            conversations: conversations.map((conv) => conv._id),
        };
    }

    @CatchError()
    public async getTabCount(workspaceId: string, user: User, tab: ConversationTabFilter, query: any) {
        const queries = await this.getTabFilters(user, workspaceId, true);
        const tabQuery = queries?.[tab];

        const newQuery = {
            $and: [{ ...(query.filter || {}) }, { ...tabQuery }],
        };

        const conversations = await this.model.find(newQuery).select('_id');

        return {
            conversations: conversations.map((conv) => conv._id),
            filtersQuery: query.filter || {},
        };
    }

    async updateConversationPriority(conversationId: string, priority: number) {
        await this.updateRaw(
            {
                _id: conversationId,
            },
            {
                $set: {
                    priority,
                },
            },
        );
    }

    /**
     * Permite que um membro transfira a conversa para outro time
     * @param conversationId
     * @param memberId
     * @param teamId
     * @param workspaceId
     * @param leaveConversation
     * @returns
     */
    @CatchError()
    public async transferConversation(
        conversationId: string,
        memberId: string,
        teamId: string,
        workspaceId: string,
        leaveConversation: boolean,
        fromQueue?: boolean,
    ): Promise<void> {
        const conversation = await this.findOne({ _id: conversationId });

        if (!conversation) {
            if (fromQueue) return;
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.workspace._id !== workspaceId) {
            if (fromQueue) return;

            throw Exceptions.CONVERSATION_WORKSPACEID_MISMATCH;
        }

        const conversationMember = conversation.members?.find((member) => member.id === memberId);

        // @TODO: criar pipe para esse tipo de validação
        if (!conversationMember) {
            if (fromQueue) return;

            throw Exceptions.DONT_PARTICIPATE_IN_THE_CONVERSATION;
        }

        const team = await this.teamService.getOne(teamId);

        if (!team) {
            if (fromQueue) return;

            throw Exceptions.TEAM_NOT_FOUND;
        }

        // Lançar exceção caso time não possa receber tranferencia de atendimento pelo transbordo,
        // caso venha de um evento da fila permitir transferencia mesmo com o campo canReceiveTransfer == true
        if (!team?.canReceiveTransfer && !fromQueue) {
            throw Exceptions.TEAM_CANNOT_RECEIVE_CONVERSATION_TRANSFER;
        }

        // Lançar exceção caso time esteja inativado,
        // caso venha de um evento da fila permitir transferencia mesmo com o campo inactivatedAt não seja null
        if (!!team?.inactivatedAt && !fromQueue) {
            throw Exceptions.TEAM_INACTIVATED;
        }

        if (conversationMember?.disabled) {
            return;
        }

        const teamPermission = await this.teamService.getUserTeamPermissions(
            workspaceId,
            memberId,
            TeamPermissionTypes.canTransferConversations,
            conversation.assignedToTeamId,
        );

        if (!teamPermission) {
            if (fromQueue) return;
            throw Exceptions.NOT_ALLOWED_TO_TRANSFER_CONVERSATIONS;
        }

        await this.updateRaw(
            {
                _id: conversationId,
            },
            {
                assignedToUserId: memberId,
                assignedToTeamId: team._id,
                expiresAt: 0,
                expirationTime: 0,
                beforeExpiresAt: 0,
                beforeExpirationTime: 0,
            },
        );

        conversation.assignedToTeamId = castObjectIdToString(team._id);
        await this.dispatchAssignedToTeamActivity(conversation, {
            userId: memberId,
            team: team as any,
            conversationId,
            assignedByMember: conversationMember,
        });

        if (!leaveConversation) {
            const memberIsOnTeam = await this.teamService.getUserIsOnTeam(memberId, teamId);
            leaveConversation = !memberIsOnTeam;
        }

        if (leaveConversation) {
            await this.disableMember(conversationId, memberId);
            this.publishMemberUpdatedEvent(conversationId);
        }
    }

    @CatchError()
    async getConversationsResume(
        workspaceId: string,
        resumeType: 'team-resume' | 'user-resume' | 'team-resume-closed-day',
        teamId?: string,
    ) {
        const now = moment.utc().valueOf();
        switch (resumeType) {
            case 'team-resume': {
                return await this.getGroupedByTeamResume(workspaceId, now);
            }
            case 'user-resume': {
                return await this.getGroupedByUserResume(workspaceId, now, teamId);
            }
            case 'team-resume-closed-day': {
                return await this.getGroupedByTeamResumeClosedDay(workspaceId);
            }
        }
    }

    @CatchError()
    private async getGroupedByTeamResumeClosedDay(workspaceId: string) {
        const metricsTeamClosedDay = await this.getMetricsTeamClosedDay(workspaceId);
        return { metricsTeamClosedDay };
    }

    @CatchError()
    private async getGroupedByUserResume(workspaceId: string, now: number, teamId?: string) {
        const waitingAverageTime = await this.getWaitingAverageTimeGroupedByMember(workspaceId, now, teamId);
        const attendanceAverageTime = await this.getAttendanceAverageTimeGroupedBy(
            workspaceId,
            'members.id',
            now,
            teamId,
        );
        const closedToday = await this.getMetricsAgentClosedDay(workspaceId, teamId);
        return { waitingAverageTime, attendanceAverageTime, closedToday };
    }

    @CatchError()
    private async getGroupedByTeamResume(workspaceId: string, now: number) {
        const waitingAverageTime = await this.getWaitingAverageTimeGroupedByTeam(workspaceId, now);
        const attendanceAverageTime = await this.getAttendanceAverageTimeGroupedBy(
            workspaceId,
            'assignedToTeamId',
            now,
        );
        return { waitingAverageTime, attendanceAverageTime };
    }

    @CatchError()
    private async getWaitingAverageTimeGroupedByTeam(workspaceId: string, now: number, teamId?: string) {
        try {
            const groupField = 'assignedToTeamId';
            const data = [];

            const findParams: any = {
                'workspace._id': workspaceId,
                state: ConversationStatus.open,
                createdByChannel: { $ne: 'webemulator' },
                assignedToTeamId: { $ne: null },
                $or: [
                    {
                        members: {
                            $elemMatch: {
                                type: { $eq: IdentityType.bot },
                                disabled: { $eq: true },
                            },
                        },
                    },
                    {
                        createdByChannel: ChannelIdConfig.liveagent,
                    },
                ],
                members: {
                    $not: {
                        $elemMatch: {
                            type: IdentityType.agent,
                            disabled: false,
                        },
                    },
                },
            };

            if (teamId) {
                findParams.assignedToTeamId = teamId;
            }

            const conversations = await this.model.find(findParams);

            for (const conversation of conversations) {
                const hasAgent = conversation.members.find((mem) => mem.type === IdentityType.agent && !mem.disabled);
                if (!hasAgent) {
                    const dataIndex = data.findIndex((item) => item._id === conversation[groupField]);

                    if (dataIndex > -1) {
                        data[dataIndex].count += 1;
                        data[dataIndex].averageTime += now - (conversation?.metrics?.assignmentAt || now);
                    } else {
                        data.push({
                            _id: conversation[groupField],
                            count: 1,
                            averageTime: now - (conversation?.metrics?.assignmentAt || now),
                        });
                    }
                }
            }

            return data.map((item) => {
                item.averageTime = item.averageTime / item.count;
                return item;
            });
        } catch (e) {
            console.log('ERROR ConversationService.getWaitingAverageTimeGroupedByTeam: ', e),
                Sentry.captureEvent({
                    message: 'ConversationService.getWaitingAverageTimeGroupedByTeam: ',
                    extra: {
                        error: e,
                        workspaceId,
                    },
                });
        }
    }

    @CatchError()
    private async getWaitingAverageTimeGroupedByMember(workspaceId: string, now: number, teamId?: string) {
        const data = [];

        const findParams: any = {
            'workspace._id': workspaceId,
            waitingSince: { $gt: 0 },
            state: ConversationStatus.open,
            createdByChannel: { $ne: 'webemulator' },
        };

        if (teamId) {
            findParams.assignedToTeamId = teamId;
        }

        const conversations = await this.model.find(findParams);

        for (const conversation of conversations) {
            for (const member of conversation.members) {
                if (member.type === IdentityType.agent && !member.disabled) {
                    const dataIndex = data.findIndex((item) => item._id === member.id);

                    if (dataIndex > -1) {
                        data[dataIndex].count += 1;
                        data[dataIndex].averageTime += now - conversation.waitingSince;
                    } else {
                        data.push({
                            _id: member.id,
                            count: 1,
                            averageTime: now - conversation.waitingSince,
                        });
                    }
                }
            }
        }

        return data.map((item) => {
            item.averageTime = item.averageTime / item.count;
            return item;
        });
    }

    @CatchError()
    private async getAttendanceAverageTimeGroupedBy(
        workspaceId: string,
        groupField: string,
        now: number,
        teamId?: string,
    ) {
        const matchQuery: any = {
            'workspace._id': workspaceId,
            'members.type': IdentityType.agent,
            'members.disabled': false,
            state: ConversationStatus.open,
            createdByChannel: { $ne: 'webemulator' },
        };

        if (teamId) {
            matchQuery.assignedToTeamId = teamId;
        }

        const query: any[] = [
            {
                $match: matchQuery,
            },
            {
                $group: {
                    _id: `$${groupField}`,
                    count: { $sum: 1 },
                    averageTime: { $avg: { $subtract: [now, '$metrics.assignmentAt'] } },
                },
            },
        ];

        if (groupField === 'members.id') {
            query.unshift({
                $unwind: '$members',
            });
        }

        const result = await this.model.aggregate(query);

        return result;
    }

    @CatchError()
    private async getMetricsAgentClosedDay(workspaceId: string, teamId?: string) {
        const startDate = moment().startOf('day').valueOf();

        const matchQuery: any = {
            'workspace._id': workspaceId,
            'metrics.closeAt': { $gt: startDate },
            'members.type': IdentityType.agent,
            'members.disabled': false,
            closedBy: { $ne: systemMemberId },
            state: ConversationStatus.closed,
            createdByChannel: { $ne: 'webemulator' },
        };

        if (teamId) {
            matchQuery.assignedToTeamId = teamId;
        }

        const query: any[] = [
            {
                $unwind: '$members',
            },
            {
                $match: matchQuery,
            },
            {
                $group: {
                    _id: '$closedBy',
                    count: { $sum: 1 },
                },
            },
        ];

        return await this.model.aggregate(query);
    }

    @CatchError()
    async getCountAttendanceWaitingTimeGroupedBy(workspaceId: string) {
        const query: any[] = [
            {
                $match: {
                    'workspace._id': workspaceId,
                    waitingSince: { $lt: Date.now() - 3600000, $gt: Date.now() - 3600000 * 24 * 60 }, // Mais de uma hora e menos de 60 dias
                    state: ConversationStatus.open,
                    createdByChannel: { $ne: 'webemulator' },
                },
            },
            {
                $group: {
                    _id: '$assignedToTeamId',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                },
            },
        ];

        return await this.model.aggregate(query);
    }

    @CatchError()
    private async getMetricsTeamClosedDay(workspaceId: string) {
        const startDate = moment().startOf('day').valueOf();
        const query: any[] = [
            {
                $match: {
                    'workspace._id': workspaceId,
                    'metrics.closeAt': { $gt: startDate },
                    state: ConversationStatus.closed,
                    createdByChannel: { $ne: 'webemulator' },
                },
            },
            {
                $group: {
                    _id: '$assignedToTeamId',
                    count: { $sum: 1 },
                    attendanceAverageTime: { $avg: { $subtract: ['$metrics.closeAt', '$metrics.assignmentAt'] } },
                    waitingAverageTime: { $avg: { $sum: [0, '$metrics.medianTimeToAgentReply'] } },
                },
            },
        ];

        return await this.model.aggregate(query);
    }

    @CatchError()
    async finishExpiredConversation() {
        try {
            const query = {
                $or: [{ assignedToTeamId: { $eq: null } }, { assignedToTeamId: { $eq: '' } }],
                expiresAt: { $lt: moment().valueOf(), $gt: 0 },
                state: { $eq: ConversationStatus.open },
                createdByChannel: { $ne: ChannelIdConfig.liveagent },
                members: {
                    $not: {
                        $elemMatch: {
                            $or: [
                                {
                                    disabled: {
                                        $exists: false,
                                    },
                                },
                                {
                                    disabled: false,
                                },
                            ],
                            type: {
                                $in: [IdentityType.agent, IdentityType.channel],
                            },
                        },
                    },
                },
            };
            const conversations = await this.model.find(query);
            const events: Array<Promise<any>> = conversations.map(async (conversation) => {
                const tagSpam = conversation.tags.find((tag) => tag.name === tagSpamName);
                let member: Identity;
                const existingSystem = conversation.members.find((mem) => mem.type === IdentityType.system);
                if (existingSystem) {
                    member = existingSystem;
                } else {
                    member = {
                        channelId: 'system',
                        id: systemMemberId,
                        name: 'system',
                        type: IdentityType.system,
                    };
                    await this.addMember(castObjectIdToString(conversation._id), member);
                }

                // Pega o membro do bot e desabilita, para evita que a conversa seja encerrada e o bot responda depois de ja encerrada
                const botMember = conversation.members.find((m) => m.type == IdentityType.bot);
                if (botMember) {
                    await this.disableBot(castObjectIdToString(conversation._id));
                    conversation.members = conversation.members.map((existingMember) => {
                        if (existingMember.id == botMember.id) {
                            return botMember;
                        }
                        return existingMember;
                    });
                }
                conversation.members.push(member);

                // Manda mensagem de texto de finalizacao apenas para conversas.
                // Precisamos avaliar quais tipos de canal terao que finalizar conversas.
                let activeUser = null;
                if (
                    conversation.createdByChannel &&
                    conversation.createdByChannel.startsWith(ChannelIdConfig.whatsapp)
                ) {
                    activeUser = conversation.members.find((m) => m.type == IdentityType.user && m.disabled == false);
                }
                if (
                    (conversation.createdByChannel &&
                        (conversation.createdByChannel == ChannelIdConfig.whatsweb ||
                            conversation.createdByChannel.startsWith(ChannelIdConfig.whatsapp))) ||
                    activeUser != null
                ) {
                    if (!tagSpam) {
                        const privateData = await this.privateConversationDataService.findOneByConversationId(
                            castObjectIdToString(conversation._id),
                        );
                        // Botei esses timeouts pq as mensagens estavam chegando tudo ao mesmo tempo no transbordo
                        await new Promise((resolve) => setTimeout(resolve, 1500));
                        const message =
                            privateData?.endMessage ||
                            'Este atendimento foi encerrado. Caso necessite de algo mais, estamos à disposição pra lhe ajudar. Basta retornar o contato por meio deste canal';
                        const endConversationTextActivity: ActivityDto = {
                            from: member,
                            type: ActivityType.message,
                            text: message,
                        };
                        if (!member || !member.id) {
                            console.log('missing frommmm finishExpiredConversation', conversation._id);
                            console.log('missing frommmm finishExpiredConversation MEMBER', member);
                        }
                        await this.activityService.handleActivity(
                            endConversationTextActivity,
                            castObjectIdToString(conversation._id),
                        );
                        await new Promise((resolve) => setTimeout(resolve, 1500));
                    }
                }
                await this.dispatchEndConversationActivity(castObjectIdToString(conversation._id), member, {
                    closeType: ConversationCloseType.expiration,
                });
            });
            await Promise.all(events);
        } catch (e) {
            console.log('Cannot update expired conversaions finishExpiredConversation', e);
        }
    }

    @CatchError()
    async beforeExpireConversation() {
        try {
            const query = {
                $and: [
                    {
                        expiresAt: { $gt: 0 },
                    },
                    {
                        beforeExpiresAt: { $gt: 0 },
                    },
                ],
                beforeExpiresAt: { $lt: moment().valueOf() },
                state: { $eq: ConversationStatus.open },
                createdByChannel: { $ne: ChannelIdConfig.liveagent },
                members: {
                    $not: {
                        $elemMatch: {
                            $or: [
                                {
                                    disabled: {
                                        $exists: false,
                                    },
                                },
                                {
                                    disabled: false,
                                },
                            ],
                            type: {
                                $in: [IdentityType.agent, IdentityType.channel],
                            },
                        },
                    },
                },
            };

            const conversations = await this.model.find(query);
            const events: Array<Promise<any>> = conversations.map(async (conversation) => {
                const tagSpam = conversation.tags.find((tag) => tag.name === tagSpamName);
                if (tagSpam) {
                    return;
                }
                const activeUser = conversation.members.find(
                    (m) => m.type == IdentityType.user && (!m.hasOwnProperty('disabled') || m.disabled == false),
                );

                if (activeUser && activeUser.id) {
                    const beforeEndConversationActivity: ActivityDto = {
                        from: activeUser,
                        type: ActivityType.event,
                        name: 'before_end_conversation',
                    };
                    if (!activeUser || !activeUser.id) {
                        console.log('missing frommmm beforeExpireConversation', conversation._id);
                        console.log('missing frommmm finishExpiredConversation MEMBER', activeUser);
                    }
                    await this.activityService.handleActivity(
                        beforeEndConversationActivity,
                        castObjectIdToString(conversation._id),
                    );
                }

                await this.updateRaw(
                    {
                        _id: conversation._id,
                    },
                    {
                        $set: {
                            beforeExpiresAt: null,
                        },
                    },
                );
            });
            await Promise.all(events);
        } catch (e) {
            console.log('Cannot update expired conversaions beforeExpireConversation', e);
        }
    }

    @CatchError()
    async getConversationByMemberIdAndChannelConfig(memberId: string, channelConfigToken: string) {
        return await this.model.findOne({
            state: {
                $eq: ConversationStatus.open,
            },
            members: {
                $elemMatch: {
                    id: {
                        $eq: memberId,
                    },
                },
            },
            token: {
                $eq: channelConfigToken,
            },
        });
    }

    @CatchError()
    async getConversationByMemberIdListAndChannelConfig(memberIdList: string[], channelConfigToken: string) {
        return await this.model.findOne({
            state: {
                $eq: ConversationStatus.open,
            },
            members: {
                $elemMatch: {
                    id: {
                        $in: memberIdList,
                    },
                },
            },
            token: {
                $eq: channelConfigToken,
            },
        });
    }

    @CatchError()
    async searchConversations(
        term: string,
        workspaceId: string,
        limit: number,
        skip: number,
        filters: ConversationQueryFilters = {},
        user: User,
    ) {
        try {
            const isAnyAdmin = isAnySystemAdmin(user);
            const userIsWorkspaceAdmin = isWorkspaceAdmin(user, workspaceId);

            let conversationSearchResults: PaginatedModel<ConversationSearch> = {
                count: 0,
                data: [],
                currentPage: 0,
                nextPage: 0,
            };

            if (!isAnyAdmin && !userIsWorkspaceAdmin) {
                const teamsWithPermission = await this.teamService.getUserTeamPermissions(
                    workspaceId,
                    castObjectIdToString(user._id),
                    TeamPermissionTypes.canViewOpenTeamConversations,
                );
                const teamIds = teamsWithPermission.map((team) => team._id?.toString());

                const teamsCanViewHistoricConversations = await this.teamService.getUserTeamPermissions(
                    workspaceId,
                    castObjectIdToString(user._id),
                    TeamPermissionTypes.canViewHistoricConversation,
                );
                const teamsCanViewHistoricConversationsIds = teamsCanViewHistoricConversations.map((team) =>
                    team._id?.toString(),
                );

                if (filters.historicConversationTeams?.length) {
                    filters.historicConversationTeams = filters.historicConversationTeams.filter((teamId) =>
                        teamsCanViewHistoricConversationsIds.includes(teamId),
                    );
                } else {
                    filters.historicConversationTeams = [...teamsCanViewHistoricConversationsIds];
                }

                if (!filters?.teams?.length) {
                    // se não veio nenhum filtro de teams, então adiciona os teams que o usuário tem permissão
                    filters.teams = [...teamIds];
                }

                if (filters?.teams?.length) {
                    // se veio algum filtro de teams, então filtra os teams que o usuário tem permissão
                    filters.teams = filters.teams.filter((teamId) => teamIds.includes(teamId));
                }

                conversationSearchResults = await this.conversationSearchService.getAll(
                    term,
                    workspaceId,
                    limit,
                    skip,
                    filters,
                );
            } else {
                conversationSearchResults = await this.conversationSearchService.getAll(
                    term,
                    workspaceId,
                    limit,
                    skip,
                    filters,
                );
            }

            const conversationIds = conversationSearchResults.data.map((result) => result.conversationId);

            if (!conversationIds?.length) {
                return [];
            }

            const conversations = await this.model
                .find({
                    'workspace._id': workspaceId,
                    _id: { $in: conversationIds },
                })
                .select('members _id tags iid createdByChannel suspendedUntil createdAt state assignedToTeamId');

            conversationSearchResults.data = conversationSearchResults.data.map((result) => {
                const conversation = conversations.find(
                    (conversation) => castObjectIdToString(conversation._id) === result.conversationId,
                );
                return {
                    ...result,
                    conversation,
                };
            });
            return conversationSearchResults;
        } catch (ex) {
            Sentry.captureException(ex);
            if (process.env.NODE_ENV != 'production') {
                console.log(ex);
            }
        }
    }

    @CatchError()
    async findOpenedConversationByMemberIdAndChannelId(memberId: string, channelId: string, workspaceId: string) {
        return await this.findOne({
            'members.id': memberId,
            'members.channelId': channelId,
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
        });
    }

    async updateConversationInvalidNumber(conversationId: string, workspaceId: string) {
        try {
            const conversation = await this.model.findOne({
                _id: conversationId,
            });

            // se chegou um ack de número invalido para o canal recepitivo foi engano
            // pois foi o contato quem iniciou o atendimento.
            if (
                conversation.createdByChannel === ChannelIdConfig.gupshup ||
                conversation.createdByChannel === ChannelIdConfig.ads
            ) {
                return;
            }

            await this.updateRaw(
                {
                    _id: conversationId,
                },
                {
                    invalidNumber: true,
                },
            );

            // TODO: finalizar conversas com número inválido para todos os casos?
            this.eventsService.sendEvent({
                data: {
                    conversationId: conversationId,
                    workspaceId: workspaceId,
                    timestamp: moment().format().valueOf(),
                } as IGupshupNumberDontExistsReceivedEvent,
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.GUPSHUP_NUMBER_DONT_EXISTS_RECEIVED,
            });

            try {
                if (
                    conversation?.createdByChannel !== ChannelIdConfig.liveagent &&
                    conversation?.state == ConversationStatus.open
                ) {
                    await this.systemCloseConversations([conversation]);
                }
            } catch (e) {
                this.logger.error('updateConversationInvalidNumber close conversation');
                this.logger.error(e);
            }
        } catch (e) {
            this.logger.error(e);
        }
    }

    private async systemCloseConversations(conversations: Pick<Conversation, '_id' | 'members'>[]) {
        for await (const conversation of conversations) {
            const systemActive = conversation.members.find((member) => member.type === IdentityType.system);
            let member = systemActive;

            if (!systemActive) {
                member = {
                    channelId: 'system',
                    id: systemMemberId,
                    name: 'system',
                    type: IdentityType.system,
                };
                await this.addMember(castObjectIdToString(conversation._id), member);
            }

            await this.dispatchEndConversationActivity(castObjectIdToString(conversation._id), member, {
                closeType: ConversationCloseType.expiration,
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    async handleCronCloseWebemulator() {
        const conversations = await this.model
            .find({
                state: { $eq: ConversationStatus.open },
                createdByChannel: { $eq: ChannelIdConfig.webemulator },
            })
            .select('_id members')
            .limit(500);

        if (!conversations?.length) {
            return;
        }

        await this.systemCloseConversations(conversations);
    }

    @CatchError()
    async closeWorkspaceConversations(workspaceId: string, createdByChannel?: string) {
        const workspace = await this.workspacesService.getOne(workspaceId);

        if (!!createdByChannel && createdByChannel !== ChannelIdConfig.emulator) {
            throw Exceptions.BAD_REQUEST;
        } else if (!!workspace?.featureFlag?.disabledWorkspace) {
            throw Exceptions.WORKSPACE_IS_ACTIVE;
        }

        let query: any = {};

        if (createdByChannel) {
            query.createdByChannel = createdByChannel;
        }
        const conversations = await this.model
            .find({
                'workspace._id': workspaceId,
                state: { $eq: ConversationStatus.open },
                ...query,
            })
            .select('_id members');

        if (!conversations?.length) {
            return;
        }

        await this.systemCloseConversations(conversations);
    }

    @CatchError()
    async publicGetConversationResume(workspaceId: string) {
        const workspace = await this.workspacesService.getOne(workspaceId);

        if (!workspace) {
            throw Exceptions.WORKSPACE_ID_DONT_MATCH;
        }
        if (workspace?.featureFlag?.disabledWorkspace) {
            throw Exceptions.WORKSPACE_IS_INACTIVE;
        }

        const now = moment.utc().valueOf();
        const teamResume = await this.getGroupedByTeamResume(workspaceId, now);
        const closedAttendanceTeams = await this.getGroupedByTeamResumeClosedDay(workspaceId);
        const teams = await this.teamService.getAll({ workspaceId: workspaceId });
        const teamFiltered = teams?.filter((team) => team?.viewPublicDashboard);

        if (!teamFiltered?.length) {
            return [];
        }

        return teamFiltered.map((team) => {
            const itemAttendanceAverageTime = teamResume.attendanceAverageTime?.find(
                (item) => item._id === String(team._id),
            );
            const itemWaitingAverageTime = teamResume.waitingAverageTime?.find((item) => item._id === String(team._id));
            const metricsTeamClosedDay = closedAttendanceTeams.metricsTeamClosedDay?.find(
                (item) => item._id === String(team._id),
            );
            return {
                key: team._id,
                team: team.name,
                countForService: itemWaitingAverageTime?.count || 0,
                countInAttendance: itemAttendanceAverageTime?.count || 0,
                averageTimeValue: itemAttendanceAverageTime?.averageTime || 0,
                waitingAverageTimeValue: itemWaitingAverageTime?.averageTime || 0,
                attendanceAverageTimeValueClose: metricsTeamClosedDay?.attendanceAverageTime || 0,
                waitingAverageTimeValueClose: metricsTeamClosedDay?.waitingAverageTime || 0,
                countClosedAttendance: metricsTeamClosedDay?.count || 0,
            };
        });
    }

    async shouldRequestPrivacyPolicy(
        workspaceId: string,
        channelConfigToken: string,
        createConversationChannelId: ChannelIdConfig,
        phone?: string,
    ) {
        try {
            let shouldRequestPrivacyPolicy = false;
            const privacyPolicy = await this.externalDataService.getPrivacyPolicyByChannelConfigToken(
                workspaceId,
                channelConfigToken,
            );
            if (privacyPolicy) {
                shouldRequestPrivacyPolicy = true;
                if (createConversationChannelId === ChannelIdConfig.gupshup && phone) {
                    const { acceptanceAt } = await this.externalDataService.getAcceptedPrivacyPolicyByPhoneFromCache(
                        workspaceId,
                        {
                            channelConfigToken,
                            phone: phone,
                        },
                    );

                    if (
                        acceptanceAt &&
                        moment(Number(acceptanceAt)).valueOf() >
                            moment(privacyPolicy?.updateAcceptanceAt || privacyPolicy.createdAt).valueOf()
                    ) {
                        shouldRequestPrivacyPolicy = false;
                    }
                }
                return shouldRequestPrivacyPolicy;
            }
        } catch (e) {
            Sentry.captureEvent({
                message: 'getConversation: error getPrivacyPolicyByChannelConfigId',
                extra: {
                    error: e,
                },
            });
            console.log('shouldRequestPrivacyPolicy CATCH', e);
            return false;
        }
    }

    @CatchError()
    async getOpenedConversationsByAssignedToTeamId(workspaceId: string, teamId: string) {
        return await this.getAll({
            assignedToTeamId: teamId,
            state: ConversationStatus.open,
            'workspace._id': workspaceId,
        });
    }

    @CatchError()
    async getConversationById(conversationId: string) {
        return await this.model.findOne({ _id: conversationId });
    }

    @CatchError()
    async createMultipleConversation(
        workspaceId: string,
        data: CreateMultipleConversation,
        userAuth: User,
    ): Promise<ResultCreateMultipleConversation> {
        const { assignedToTeamId, channelConfigId, templateId, startMemberList, shouldCloseConversation } = data;
        let result: ResultCreateMultipleConversation = {
            countCreatedConversation: 0,
            conversationOpened: [],
            contactsBlocked: [],
        };

        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigId);

        if (
            !channelConfig ||
            workspaceId !== String(channelConfig.workspaceId) ||
            channelConfig.channelId !== ChannelIdConfig.gupshup
        ) {
            throw Exceptions.INVALID_CHANNELCONFIG;
        }

        const team = await this.teamService.getOne(assignedToTeamId);

        if (!team) {
            throw Exceptions.TEAM_NOT_FOUND;
        }

        if (!isWorkspaceAdmin(userAuth, workspaceId) && !isAnySystemAdmin(userAuth)) {
            const canSendMultipleMessage = await this.teamService.canSendMultipleMessage(
                castObjectIdToString(userAuth._id),
                assignedToTeamId,
            );
            if (!canSendMultipleMessage) {
                throw Exceptions.MEMBER_WITHOUT_PERMISSION;
            }
        }

        const canSendtemplateMessage = await this.templateMessageService.validateSendTemplateWithVariable(
            templateId,
            assignedToTeamId,
            channelConfigId,
            workspaceId,
        );

        if (!canSendtemplateMessage) {
            throw Exceptions.TEMPLATE_MESSAGE_INVALID;
        }

        const phones = startMemberList.map((member) => member.phone);
        const conversationsOpenedByPhones = await this.getOpenedConversationsByPhoneNumberList(
            phones,
            channelConfig.channelId,
            channelConfig.workspaceId,
            channelConfig.token,
        );

        if (conversationsOpenedByPhones?.length) {
            result.conversationOpened = conversationsOpenedByPhones.map((conversation) => {
                const memberUser = conversation.members.find((member) => member.type === IdentityType.user);
                return {
                    conversation: castObjectIdToString(conversation._id),
                    phone: memberUser?.phone || memberUser.id,
                };
            });
        }

        const contactList = await this.contactService.getContactByWhatsappList(phones, channelConfig.workspaceId);

        for (const startMember of startMemberList) {
            const hasOpenConversation = result.conversationOpened?.find(
                (conversation) => conversation.phone === startMember.phone,
            );

            if (hasOpenConversation) {
                continue;
            }

            const contact = contactList?.find((contact) => {
                const parsedNumber = convertPhoneNumber(contact.phone || contact.whatsapp);
                const parsedNumber2 = parsedNumber
                    .split('')
                    .filter((_, index) => index !== 4)
                    .join('');
                return parsedNumber === startMember.phone || parsedNumber2 === startMember.phone;
            }) as IContact | undefined;

            if (contact && contact?.blockedAt) {
                result.contactsBlocked.push(contact?.phone || startMember.phone);
                continue;
            }

            this.enqueueAgentCreateConversationKafka({
                team,
                channelConfig,
                contact,
                shouldCloseConversation,
                startMember,
                templateId,
                userAuth,
                workspaceId,
            });
            result.countCreatedConversation += 1;
        }

        return result;
    }

    private enqueueAgentCreateConversationKafka(data: AgentCreateConversationEventData) {
        const { workspaceId } = data;
        this.kafkaService.sendEvent(data, workspaceId, createAgentConversationTopicName);
    }

    @CatchError()
    async processAgentCreateConversation(data: AgentCreateConversationEventData): Promise<void> {
        const {
            team,
            channelConfig,
            contact,
            shouldCloseConversation,
            startMember,
            templateId,
            userAuth,
            workspaceId,
        } = data;
        let whatsappExpiration: number | undefined;

        if (channelConfig.channelId == ChannelIdConfig.gupshup) {
            const expirationSession =
                await this.whatsappSessionControlService.findSessionByWorkspaceAndNumberAndChannelConfigId(
                    channelConfig.workspaceId,
                    contact?.whatsapp ?? startMember.phone,
                    channelConfig.token,
                );
            whatsappExpiration = expirationSession?.whatsappExpiration || moment().valueOf();
        }

        const privateData = this.getChannelConfigPrivateData(channelConfig);
        const agentMember = {
            id: castObjectIdToString(userAuth._id),
            name: userAuth.name,
            channelId: ChannelIdConfig.liveagent,
            type: IdentityType.agent,
            avatar: userAuth.avatar,
            disabled: false,
        };
        const contactMember = {
            id: contact?.whatsapp ?? startMember.phone,
            name: contact?.name || startMember.name || startMember.phone,
            channelId: channelConfig.channelId,
            type: IdentityType.user,
            phone: contact?.phone || startMember.phone,
            contactId: castObjectIdToString(contact?._id),
        };

        const conversation = {
            createdByChannel: ChannelIdConfig.liveagent,
            token: channelConfig.token,
            hash: channelConfig.token,
            workspace: channelConfig.workspace,
            state: ConversationStatus.open,
            assignedToUserId: userAuth._id,
            assignedToTeamId: team._id,
            privateData,
            whatsappExpiration,
            shouldRequestRating: !!channelConfig.workspace?.featureFlag?.rating,
            members: [agentMember, contactMember],
        };

        try {
            const createdConversation = await this._create(conversation);
            createdConversation.assignedToTeamId = castObjectIdToString(team._id);

            await this.dispatchAssignedToTeamActivity(createdConversation, {
                userId: userAuth._id as string,
                team: team as any,
                conversationId: castObjectIdToString(createdConversation._id),
                assignedByMember: agentMember,
            });

            const defaultVariablevalues = [
                { key: 'agent.name', value: userAuth?.name },
                { key: 'conversation.iid', value: createdConversation?.iid },
                { key: 'user.name', value: contact?.name || contact?.phone },
                { key: 'user.phone', value: contact?.phone || startMember.phone },
            ];

            const text = await this.templateMessageService.getParsedTemplate(templateId, defaultVariablevalues);
            const templateVariableValues = await this.templateMessageService.getTemplateVariableValues(
                templateId,
                defaultVariablevalues,
            );

            const activity: any = {
                type: ActivityType.message,
                from: agentMember,
                text: text,
                conversationId: castObjectIdToString(createdConversation._id),
                templateId: templateId,
                templateVariableValues: templateVariableValues,
            };
            await this.dispatchMessageActivity(createdConversation, activity as any);

            if (startMember?.annotation) {
                await this.newActivity(workspaceId, castObjectIdToString(createdConversation._id), {
                    type: ActivityType.comment,
                    from: agentMember,
                    to: contactMember,
                    text: startMember.annotation,
                });

                await new Promise((r) => setTimeout(r, 250));
            }

            if (shouldCloseConversation) {
                await this.dispatchEndConversationActivity(castObjectIdToString(createdConversation._id), agentMember, {
                    closeType: ConversationCloseType.agent_finished,
                });
            }
        } catch (error) {
            throw Exceptions.ERROR_IN_PROCESS_CREATE_CONVERSATION;
        }
    }

    @CatchError()
    async closeEmulatorConversations(workspaceId: string) {
        let hasMoreConversations = true;

        while (hasMoreConversations) {
            const conversations = await this.model
                .find({
                    state: { $eq: ConversationStatus.open },
                    createdByChannel: { $eq: ChannelIdConfig.webemulator },
                })
                .select('_id members')
                .limit(50);

            if (!conversations.length) {
                hasMoreConversations = false;
                break;
            }

            await this.systemCloseConversations(conversations);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        return { ok: true };
    }

    /**
     * Transfere conversa para um agente específico
     * @param conversationId ID da conversa
     * @param agentId ID do agente para o qual transferir
     * @param workspaceId ID do workspace
     * @param teamId ID do time opcional para transferir a conversa
     * @param user Usuário fazendo a transferência
     */
    @CatchError()
    async transferConversationToAgent(
        conversationId: string,
        agentId: string,
        workspaceId: string,
        teamId?: string,
        user?: User,
    ): Promise<{ success: boolean }> {
        const conversation = (await this.model.findOne({ _id: conversationId }))?.toJSON?.();
        if (!conversation) {
            throw Exceptions.CONVERSATION_NOT_FOUND;
        }

        if (conversation.state !== ConversationStatus.open) {
            throw Exceptions.CONVERSATION_CLOSED;
        }

        // Verifica se o agente existe
        const resultTargetUser = await this.userService.getOne(agentId);
        const targetUser = resultTargetUser?.toJSON ? resultTargetUser.toJSON() : resultTargetUser;
        if (!targetUser) {
            throw Exceptions.USER_NOT_FOUND;
        }

        const agentIncludesMember = conversation?.members?.find((member) => member.id === agentId && !member?.disabled);
        // Verifica se o agente para o qual sera transferido o atendimento já não esta ativo no atendimento
        // E caso o atendimento esteja sendo transferido para o mesmo time
        if (!!agentIncludesMember && (!teamId || teamId === conversation?.assignedToTeamId)) {
            throw Exceptions.MEMBER_ACTIVE_IN_CONVERSATION;
        }

        // Verifica se o usuário é admin do workspace ou supervisor no time atual
        const isAdmin = isWorkspaceAdmin(user, workspaceId) || isAnySystemAdmin(user);
        // const isTeamSupervisor = (
        //     await this.teamService.getTeamByUserIsSupervisor(
        //         workspaceId,
        //         conversation.assignedToTeamId,
        //         castObjectIdToString(user._id),
        //     )
        // )?.toJSON?.();

        if (
            !isAdmin
            // && !isTeamSupervisor
        ) {
            throw Exceptions.MEMBER_WITHOUT_PERMISSION;
        }

        const newTeamId = teamId || conversation.assignedToTeamId;
        if (!newTeamId) {
            throw Exceptions.TEAM_NOT_FOUND;
        }

        // Se foi fornecido um novo time, verifica se existe e está ativo e se o agente para o qual sera tranbsferido esta no time
        const resultTeam = await this.teamService.getOne(newTeamId);
        let team: Team = resultTeam?.toJSON ? (resultTeam.toJSON() as Team) : (resultTeam as Team);
        if (!team) {
            throw Exceptions.TEAM_NOT_FOUND;
        }

        if (team.inactivatedAt) {
            throw Exceptions.TEAM_INACTIVATED;
        }

        if (!team?.canReceiveTransfer) {
            throw Exceptions.TEAM_CANNOT_RECEIVE_CONVERSATION_TRANSFER;
        }

        const agentIncludesTeam = team.roleUsers.find(
            (user) => castObjectIdToString(user.userId) === castObjectIdToString(targetUser._id),
        );
        if (!agentIncludesTeam) {
            throw Exceptions.USER_NOT_ON_TEAM;
        }

        // Caso o agente tenha apenas permissão para ver historico dentro do time ele não podera assumir o atendimento
        if (!!agentIncludesTeam?.permission?.canViewHistoricConversation) {
            throw Exceptions.USER_NOT_HAVE_PERMISSION_ON_TEAM;
        }

        // Desabilita todos os agentes atuais da conversa usando um único update
        // Atualiza o time caso tenha sido passado via param e assina pra o novo agente
        await this.updateRaw(
            {
                _id: conversationId,
            },
            {
                $set: {
                    'members.$[elem].disabled': true,
                    ...(teamId && teamId !== conversation.assignedToTeamId ? { assignedToTeamId: teamId } : {}),
                    assignedToUserId: agentId,
                },
            },
            {
                arrayFilters: [{ 'elem.type': IdentityType.agent }],
            },
        );

        // Verifica se o agente já está na conversa
        const targetAgentMember = conversation.members.find(
            (member) => member.id === agentId && member.type === IdentityType.agent,
        );

        if (targetAgentMember) {
            // Se já estiver, reativa
            await this.updateRaw(
                {
                    _id: conversationId,
                    'members.id': targetAgentMember.id,
                },
                {
                    $set: {
                        'members.$.disabled': false,
                    },
                },
            );
        } else {
            // Se não estiver, adiciona como membro
            await this.addMember(
                castObjectIdToString(conversation._id),
                {
                    id: agentId,
                    name: targetUser.name,
                    avatar: targetUser.avatar,
                    channelId: 'agent',
                    type: IdentityType.agent,
                    disabled: false,
                    metrics: {
                        assumedAt: +new Date(),
                    },
                },
                false,
            );
        }

        const fromAgent = {
            id: castObjectIdToString(user._id),
            name: user.name,
            channelId: 'live-agent',
            type: IdentityType.agent,
        };
        // loop para enviar mensagem de remoção de todos os agentes que estavam ativos no atendimento
        for (const member of conversation?.members) {
            if (
                member.type === IdentityType.agent &&
                !member?.disabled &&
                castObjectIdToString(member.id) !== castObjectIdToString(targetUser._id)
            ) {
                const activityRequestDto: ActivityDto = {
                    type: ActivityType.member_removed_by_admin,
                    from: fromAgent,
                    to: member,
                    data: {
                        id: member.id,
                        name: member.name,
                    },
                };
                await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));
            }
        }

        // se o time mudou deve mandar evento de transferencia de time
        if (teamId !== conversation?.assignedToTeamId) {
            const updatedConversation = (await this.model.findOne({ _id: conversationId }))?.toJSON?.(); // pega conversa atualizada
            await this.dispatchAssignedToTeamActivity(updatedConversation, {
                userId: castObjectIdToString(user._id),
                team: team as any,
                conversationId,
                assignedByMember: fromAgent,
            });
        }

        const activityRequestDto: ActivityDto = {
            type: ActivityType.member_add_by_admin,
            from: fromAgent,
            to: {
                id: castObjectIdToString(targetUser._id),
                name: targetUser.name,
                channelId: 'live-agent',
                type: IdentityType.agent,
                disabled: false,
            },
            data: {
                id: castObjectIdToString(targetUser._id),
                name: targetUser.name,
            },
        };
        await this.activityService.handleActivity(activityRequestDto, castObjectIdToString(conversation._id));

        this.publishMemberUpdatedEvent(conversationId);

        return { success: true };
    }

    async updateDeliveredMessageInConversation(conversationId: string) {
        try {
            await this.updateRaw(
                {
                    _id: conversationId,
                    deliveredMessage: { $ne: true },
                },
                {
                    deliveredMessage: true,
                },
            );
        } catch (e) {
            this.logger.log('Error on updateDeliveredMessageInConversation', { error: e });
            Sentry.captureEvent({
                message: `${ConversationService.name}.updateDeliveredMessageInConversation: `,
                extra: {
                    error: e,
                },
            });
        }
    }

    async recreateSmtRe(conversationId: string, workspaceId: string, smtReId: string): Promise<{ success: boolean }> {
        try {
            // Verificar se a conversa existe
            const conversation = await this.getOne(conversationId);

            if (conversation?.smtReId && !conversation?.stoppedSmtReId) {
                return;
            }
            if (!conversation) {
                throw Exceptions.CONVERSATION_NOT_FOUND;
            }

            // Verificar se já tem smtReId setado
            if (conversation.smtReId) {
                throw Exceptions.CONVERSATION_SMT_RE_ALREADY_SET;
            }

            const createdSmtRe = await this.externalDataService.findSmtReById(conversation.stoppedSmtReId);

            if (!createdSmtRe?.smtReSetting?.automaticReactivate) {
                return;
            }
            // Criar o registro de smtRe passando o assignedToTeamId da conversa
            const smtRe = await this.externalDataService.createSmtRe(
                conversationId,
                workspaceId,
                createdSmtRe.smtReSettingId,
                conversation.assignedToTeamId,
            );

            // Atualizar a conversa com o smtReId
            await this.model.updateOne({ _id: conversationId }, { smtReId: smtRe.id, stoppedSmtReId: null });

            return { success: true };
        } catch (e) {
            Sentry.captureEvent({
                message: 'ConversationService.recreateSmtRe',
                extra: {
                    error: e,
                },
            });
        }
    }

    async createSmtRe(
        conversationId: string,
        workspaceId: string,
        smtReSettingId: string,
    ): Promise<{ success: boolean }> {
        try {
            // Verificar se a conversa existe
            const conversation = await this.getOne(conversationId);
            if (conversation.smtReId) {
                return { success: false };
            }
            if (!conversation) {
                throw Exceptions.CONVERSATION_NOT_FOUND;
            }

            // Verificar se já tem smtReId setado
            if (conversation.smtReId) {
                throw Exceptions.CONVERSATION_SMT_RE_ALREADY_SET;
            }

            // Criar o registro de smtRe passando o assignedToTeamId da conversa
            const smtRe = await this.externalDataService.createSmtRe(
                conversationId,
                workspaceId,
                smtReSettingId,
                conversation.assignedToTeamId,
            );

            // Atualizar a conversa com o smtReId
            await this.model.updateOne({ _id: conversationId }, { smtReId: smtRe.id });

            return { success: true };
        } catch (e) {
            Sentry.captureEvent({
                message: 'ConversationService.createSmtRe',
                extra: {
                    error: e,
                },
            });
        }
    }

    async stopSmtRe(conversationId: string, workspaceId: string, memberId: string): Promise<{ success: boolean }> {
        try {
            // Verificar se a conversa existe
            const conversation = await this.getOne(conversationId);
            if (!conversation) {
                throw Exceptions.CONVERSATION_NOT_FOUND;
            }

            // Verificar se tem smtReId configurado
            if (!conversation.smtReId) {
                throw Exceptions.CONVERSATION_SMT_RE_NOT_CONFIGURED;
            }

            const smtReId = conversation.smtReId;
            // Parar o smtRe
            await this.externalDataService.stopSmtRe(conversationId, memberId);

            // Atualizar a conversa para setar smtReId como null e o stoppedSmtReId com o que estava no smtReId
            await this.model.updateOne(
                { _id: conversationId },
                { smtReId: null, stoppedSmtReId: smtReId, isWithSmtRe: false },
            );

            return { success: true };
        } catch (e) {
            Sentry.captureEvent({
                message: 'ConversationService.stopSmtRe',
                extra: {
                    error: e,
                },
            });
        }
    }

    async updateConversationIsWithSmtRe(conversationId: string) {
        const conversation = await this.getOne(conversationId);
        return await this.model.updateOne({ _id: conversationId }, { isWithSmtRe: !conversation?.isWithSmtRe });
    }
}
