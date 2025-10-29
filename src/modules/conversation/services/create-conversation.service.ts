import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ActivityType, ChannelIdConfig, ConversationStatus, IdentityType } from 'kissbot-core';
import { castObjectId, castObjectIdToString, getTime, systemMemberId } from './../../../common/utils/utils';
import { PrivateConversationDataService } from './../../private-conversation-data/services/private-conversation-data.service';
import { ActivityDto } from '../dto/activities.dto';
import { Conversation, Identity } from '../interfaces/conversation.interface';
import { ChannelConfigService } from './../../channel-config/channel-config.service';
import { CacheService } from './../../_core/cache/cache.service';
import { ConversationService } from './conversation.service';
import { Workspace } from './../../workspaces/interfaces/workspace.interface';
import { Bot } from './../../bots/interfaces/bot.interface';
import { ChannelConfig } from './../../channel-config/interfaces/channel-config.interface';
import { AutoAssignConversationService } from '../../auto-assign/services/auto-assign-conversation.service';
import * as Sentry from '@sentry/node';
import { ExternalDataService } from './external-data.service';
import moment from 'moment';
import { TeamService } from './../../team/services/team.service';
import { Team } from '../../team/interfaces/team.interface';

export interface ICreateConversation {
    memberId: string;
    memberName: string;
    memberPhone?: string;
    memberDDI?: string;
    memberAvatar?: string;
    memberChannel?: string;
    channelConfigToken: string;
    channelId: ChannelIdConfig;
    privateConversationData: any;
    activityText: string;
    activityHash: string;
    activityTimestamp: number;
    activityQuoted?: string;
    channelConfig?: Partial<ChannelConfig> & {
        workspace: Partial<Workspace>;
        bot: Partial<Bot>;
    };
    referralSourceId?: string;
}
@Injectable()
export class CreateConversationService {
    constructor(
        public cacheService: CacheService,
        @Inject(forwardRef(() => ConversationService))
        private conversationService: ConversationService,
        private readonly channelConfigService: ChannelConfigService,
        private readonly privateConversationDataService: PrivateConversationDataService,
        private readonly autoAssignConversationService: AutoAssignConversationService,
        private readonly teamService: TeamService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async getExistingConversation(channelConfigToken: string, memberId: string): Promise<Conversation> {
        let conversation: Conversation;

        const conversationId: string = await this.cacheService.get(
            this.getConversationCacheKey(memberId, channelConfigToken),
        );

        if (conversationId) {
            conversation = await this.conversationService.findOne({ _id: castObjectId(conversationId) });
            if (conversation && conversation.state != ConversationStatus.open) {
                conversation = null;
            }
        }

        return conversation;
    }

    async getConversation(createConversation: ICreateConversation): Promise<{
        conversation: Conversation;
        startActivity: undefined | ActivityDto;
    }> {
        const { memberId, channelConfigToken } = createConversation;

        let conversation: Conversation = await this.getExistingConversation(channelConfigToken, memberId);

        if (!conversation) {
            conversation = await this.conversationService.getConversationByMemberIdAndChannelConfig(
                memberId,
                channelConfigToken,
            );
        }

        let startActivity: undefined | ActivityDto;
        if (!conversation) {
            if (createConversation?.channelConfig?.workspace?._id) {
                const blockedContact = await this.externalDataService.getBlockedContactByWhatsapp(
                    castObjectIdToString(createConversation.channelConfig.workspace._id),
                    createConversation.memberId,
                );
                if (!!blockedContact) {
                    return { conversation: null, startActivity: null };
                }
            }

            conversation = await this.createNewConversation(createConversation);
            if (conversation) {
                startActivity = this.getActivityDto(createConversation, conversation);
                startActivity.name = 'start';

                try {
                    let shouldRequestPrivacyPolicy = await this.conversationService.shouldRequestPrivacyPolicy(
                        conversation.workspace._id,
                        channelConfigToken,
                        createConversation.channelId,
                        createConversation.memberPhone,
                    );

                    if (shouldRequestPrivacyPolicy) {
                        startActivity.data = {
                            ...(startActivity?.data || {}),
                            shouldRequestPrivacyPolicy: shouldRequestPrivacyPolicy,
                        };
                    }
                } catch (e) {
                    Sentry.captureEvent({
                        message: 'getConversation: error shouldRequestPrivacyPolicy',
                        extra: {
                            error: e,
                        },
                    });
                }
            }
        }

        if (conversation) {
            await this.cacheService.set(conversation._id, this.getConversationCacheKey(memberId, channelConfigToken));
        }
        return { conversation, startActivity };
    }

    getConversationCacheKey(memberId: string, token: string) {
        return `${token}:${memberId}`;
    }

    private async createNewConversation(createConversation: ICreateConversation): Promise<any> {
        let { memberId, channelConfigToken, privateConversationData, memberName, channelConfig, referralSourceId } =
            createConversation;

        if (!channelConfig) {
            channelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfigToken);
        }

        if (!channelConfig.enable) {
            return null;
        }

        const channelConfigId = castObjectIdToString(channelConfig?._id);

        let existingAutoAssign;

        try {
            existingAutoAssign = await this.autoAssignConversationService.getAutoAssignConversationByContactPhone(
                channelConfig.workspaceId,
                channelConfigId,
                memberId,
            );
        } catch (error) {
            try {
                Sentry.captureEvent({
                    message: 'createNewConversation: error getAutoAssignConversationByContactPhone',
                    extra: {
                        error,
                    },
                });
            } catch (e) {
                console.error('Error on sending sentry INTERNAL_ERROR', e);
            }
        }

        const members: Identity[] = [
            {
                channelId: createConversation.memberChannel || createConversation.channelId,
                id: memberId,
                name: memberName,
                type: IdentityType.user,
                phone: createConversation.memberPhone,
                avatar: createConversation.memberAvatar,
                ddi: createConversation.memberDDI,
            },
        ];

        const botMember = await this.getBotAsConversationMemberByToken(channelConfig);

        if (botMember) {
            members.push({ ...botMember, disabled: !!existingAutoAssign });
        }

        const conversationToCreate: any = {
            hash: channelConfigToken,
            token: channelConfig.token,
            createdByChannel: createConversation.channelId,
            expirationTime:
                channelConfig.expirationTime &&
                getTime(channelConfig.expirationTime.timeType as any, channelConfig.expirationTime.time),
            workspace: channelConfig.workspace,
            bot: channelConfig.bot,
            members,
            shouldRequestRating: !!channelConfig.workspace?.generalConfigs?.enableRating,
            referralSourceId: referralSourceId,
        };

        let team: Team;
        try {
            // se existe auto atribuir para o número que entrou em contato e o channelConfigId estiver vinculado
            // assinar para o time vinculado, e setar se pode enviar avaliação no final do atendimento
            if (!!existingAutoAssign && existingAutoAssign?.channelConfigIds?.includes(channelConfigId)) {
                team = await this.teamService.getOne(existingAutoAssign.teamId);
                if (team) {
                    conversationToCreate.assignedToTeamId = existingAutoAssign.teamId;
                    conversationToCreate.priority = team?.priority || 0;
                }

                if (!!channelConfig.workspace?.generalConfigs?.enableRating && existingAutoAssign.enableRating) {
                    conversationToCreate.shouldRequestRating = existingAutoAssign.enableRating;
                } else {
                    conversationToCreate.shouldRequestRating = false;
                }
            }
        } catch (error) {
            try {
                Sentry.captureEvent({
                    message: 'createNewConversation: error existAutoAssign',
                    extra: {
                        error,
                    },
                });
            } catch (e) {
                console.error('Error on sending sentry INTERNAL_ERROR', e);
            }
        }

        const conversation = await this.conversationService._create(conversationToCreate);
        await this.privateConversationDataService.updateRaw(
            { conversationId: conversation._id },
            {
                $set: {
                    privateData: privateConversationData,
                },
                endMessage: channelConfig.endMessage || '',
            },
        );
        try {
            if (!!existingAutoAssign && existingAutoAssign?.channelConfigIds?.includes(channelConfigId) && !!team) {
                let systemMember;
                if (!systemMember) {
                    systemMember = {
                        channelId: 'system',
                        id: systemMemberId,
                        name: 'system',
                        type: IdentityType.system,
                    };
                    await this.conversationService.addMember(
                        castObjectIdToString(conversation._id),
                        systemMember,
                        false,
                    );
                }

                const activity = {
                    type: ActivityType.assigned_to_team,
                    from: systemMember,
                    conversationId: castObjectIdToString(conversation?._id),
                    data: {
                        autoAssignId: existingAutoAssign.id,
                        teamId: existingAutoAssign.teamId,
                    },
                };
                await this.conversationService.dispatchMessageActivity(conversation, activity);
            }
        } catch (error) {
            try {
                Sentry.captureEvent({
                    message: 'createNewConversation: send activity error existAutoAssign',
                    extra: {
                        error,
                    },
                });
            } catch (e) {
                console.error('Error on sending sentry INTERNAL_ERROR', e);
            }
        }

        return conversation;
    }

    private async getBotAsConversationMemberByToken(channelConfig: any) {
        if (channelConfig.bot && channelConfig.bot._id) {
            return {
                id: channelConfig.bot._id,
                name: channelConfig.bot.name,
                channelId: 'kissbot',
                type: IdentityType.bot,
            };
        }
        return null;
    }

    private getActivityDto(createConversation: ICreateConversation, conversation: Conversation): ActivityDto {
        const { memberId, activityText, activityHash, activityTimestamp, activityQuoted } = createConversation;

        const from: Identity = conversation.members.find((member) => member.id == memberId);
        const to: Identity = conversation.members.find((member) => member.type == IdentityType.bot);
        const activity: ActivityDto = {
            from,
            to,
            type: ActivityType.event,
            hash: activityHash,
            text: activityText,
        };

        activity.timestamp = activityTimestamp as any;

        if (!!activityQuoted) {
            activity.quoted = activityQuoted;
        }

        return activity;
    }
}
