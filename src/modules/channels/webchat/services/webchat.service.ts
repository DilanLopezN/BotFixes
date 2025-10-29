import { Injectable } from '@nestjs/common';
import { ChannelConfigService } from './../../../channel-config/channel-config.service';
import { ICreateWebchatConversation } from '../interfaces/create-webchat-conversation.interface';
import { ConversationService } from './../../../conversation/services/conversation.service';
import {
    ActivityType,
    ChannelIdConfig,
    IdentityType,
    ISocketSendRequestEvent,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
} from 'kissbot-core';
import { castObjectIdToString, getTime } from './../../../../common/utils/utils';
import { PrivateConversationDataService } from './../../../private-conversation-data/services/private-conversation-data.service';
import { Conversation, ConversationWorkspace } from './../../../conversation/interfaces/conversation.interface';
import { ActivityDto } from './../../../conversation/dto/activities.dto';
import { CreateWebchatActivity } from '../interfaces/create-webchat-activity.interface';
import * as moment from 'moment';
import { ActivityService } from './../../../activity/services/activity.service';
import { Activity } from './../../../activity/interfaces/activity';
import { EventsService } from './../../../events/events.service';
import { v4 } from 'uuid';
import { AttachmentService } from './../../../attachment/services/attachment.service';
import { orderBy } from 'lodash';

@Injectable()
export class WebchatService {
    constructor(
        private readonly channelConfigService: ChannelConfigService,
        private readonly conversationService: ConversationService,
        private readonly privateConversationDataService: PrivateConversationDataService,
        private readonly activityService: ActivityService,
        private readonly eventsService: EventsService,
        private readonly attachmentService: AttachmentService,
    ) {}

    async createConversation(data: ICreateWebchatConversation) {
        try {
            const { token, user, expirationTime, channelId } = data;
            const config = await this.channelConfigService.getOneBtIdOrToken(token);
            if (!config.enable) return null;
            const toChannelId = process.env.NODE_ENV == 'test' ? 'channel_test' : 'kissbot';

            const conversation: Partial<Conversation> = {
                workspace: config.workspace as ConversationWorkspace,
                bot: {
                    _id: config.bot.id,
                    name: config.bot.name,
                    workspaceId: castObjectIdToString(config.bot.workspaceId),
                },
                expirationTime: expirationTime && getTime(expirationTime.timeType, expirationTime.time),
                hash: token,
                token: token,
                createdByChannel: channelId,
                shouldRequestRating: !!config.workspace?.generalConfigs?.enableRating,
            };

            const members = [
                {
                    id: user.id,
                    channelId: channelId,
                    name: user.name,
                    type: IdentityType.user,
                },
            ];
            if (user.data.botId) {
                members.push({
                    id: user.data.botId,
                    channelId: toChannelId,
                    name: config.bot.name || 'Assistent',
                    type: IdentityType.bot,
                });
            }
            conversation.members = members;
            const createdConversation = await this.conversationService._create(conversation);

            await this.privateConversationDataService.updateRaw(
                { conversationId: createdConversation._id },
                {
                    endMessage: config.endMessage || '',
                },
            );

            const webchatConversation = this.getWebchatConversation(createdConversation);

            return webchatConversation;
        } catch (e) {
            console.log('WebchatService.createConversation', e);
        }
    }

    getWebchatConversation(conversation: Partial<Conversation>) {
        const member = conversation.members.find((memberToFind) => memberToFind.type == IdentityType.user);
        const memberRoomId = this.getMemberRoomId(castObjectIdToString(conversation._id), member.id);

        return {
            ...(conversation.toJSON ? conversation.toJSON({ minimize: false }) : conversation),
            conversationId: conversation._id,
            streamUrl:
                process.env.CHAT_SOCKET_URI +
                '?id=' +
                memberRoomId +
                // + '&onDisconnect=' + this.ON_DISCONNECT_CALLBACK_TOKEN_KEY
                // + '&onConnect=' + this.ON_CONNECT_CALLBACK_TOKEN_KEY
                '&conversationId=' +
                conversation._id +
                '&channelId=' +
                conversation.createdByChannel,
        };
    }

    getMemberRoomId(conversationId: string, fromId: string) {
        return conversationId + '::' + fromId;
    }

    private async getFrom(conversation: Conversation, memberId: string, channelId: ChannelIdConfig) {
        let from = conversation.members.find((mem) => mem.id == memberId);
        if (!from) {
            from = conversation.members.find((mem) => mem.channelId == channelId);
        }
        return from.id;
    }

    async handleActivity(webchatActivityRequest: CreateWebchatActivity, conversationId: string) {
        const conversation: Conversation = await this.conversationService.getOne(conversationId);
        try {
            webchatActivityRequest.from.id = await this.getFrom(
                conversation,
                webchatActivityRequest.from.id,
                webchatActivityRequest.from.channelId as ChannelIdConfig,
            );
        } catch (error) {
            console.log('WEBCHAT handleActivity error getFrom: ', error);
        }
        const activity: ActivityDto = await this.transformWebchatActivity(webchatActivityRequest, conversation);

        if (activity.type === ActivityType.event && activity.name === 'resume') {
            let rawActivities = await this.activityService.getConversationActivitiesByTypes(
                conversationId,
                conversation.workspace._id,
                [ActivityType.message, ActivityType.member_upload_attachment, ActivityType.rating_message],
            );

            rawActivities = orderBy(rawActivities, 'timestamp', 'asc');

            const activities = rawActivities
                .map(
                    (act) =>
                        ({
                            ...(act.toJSON ? act.toJSON({ minimize: false }) : act),
                            id: act._id,
                        } as Activity),
                )
                .map((currActivity: Activity) => {
                    return this.transformActivityAttachments(currActivity);
                });

            const memberRoomId = this.getMemberRoomId(conversationId, webchatActivityRequest.from.id);

            this.sendToSocket(
                {
                    activities,
                    watermark: `${activities.length - 1}`,
                },
                memberRoomId,
            );
            return;
        }

        if (activity.type === ActivityType.event && activity.name === 'finished') {
            // Desabilitando temporariamente o evento de finished
            // Webchat deve lançar o activity do tipo ActivityType.end_conversation para finalizar
            return;
        } else if (activity.type === ActivityType.event && activity.name === 'start') {
            const member = activity.from;

            const existMember = conversation.members.find((currMember) => currMember.id === member.id);

            const memberToUpdate = {
                ...((existMember as any).toJSON ? (existMember as any).toJSON({ minimize: false }) : existMember),
                ...member,
            };

            await this.conversationService.updateMember(conversationId, memberToUpdate);

            try {
                let shouldRequestPrivacyPolicy = await this.conversationService.shouldRequestPrivacyPolicy(
                    conversation.workspace._id,
                    conversation.token,
                    conversation.createdByChannel as ChannelIdConfig,
                );

                if (shouldRequestPrivacyPolicy) {
                    activity.data = {
                        ...(activity?.data || {}),
                        shouldRequestPrivacyPolicy: shouldRequestPrivacyPolicy,
                    };
                }
            } catch (e) {
                console.log('error on webchat handleActivity, shouldRequestPrivacyPolicy');
            }
        }

        delete activity.language;

        const createdActivity = await this.conversationService.dispatchMessageActivity(conversation, activity);
        createdActivity.id = createdActivity._id;
        return createdActivity;
    }

    sendToSocket(data: any, room: any) {
        const socketEvent: ISocketSendRequestEvent = {
            data,
            room,
            sendAsString: true,
        } as any;
        this.eventsService.sendEvent({
            data: socketEvent,
            dataType: KissbotEventDataType.SOCKET,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.SOCKET_SEND_REQUEST,
        });
    }

    public transformActivityAttachments = (activity: Activity) => {
        if (activity.type === ActivityType.member_upload_attachment) {
            activity.attachments = [
                {
                    contentUrl: activity.attachmentFile.contentUrl,
                    contentType: activity.attachmentFile.contentType,
                    name: activity.attachmentFile.name,
                },
            ];
            activity.type = ActivityType.message;
        }

        return activity;
    };

    private async transformWebchatActivity(
        webchatActivityRequest: CreateWebchatActivity,
        conversation: Conversation,
    ): Promise<ActivityDto> {
        // Se tiver rodando o teste deve dar match com o channel_test que está descrito no test unitário dessa classe
        const toChannelId = process.env.NODE_ENV == 'test' ? 'channel_test' : 'kissbot';

        // Campo "to" montado com base no channelId(channel do registro de bot).
        // É esse id que é o id de membro do engine e não o botId, pois no futuro esse dado será enviado
        // para o engine e a conversa será com um channel/assistent e não com bot;
        return {
            ...webchatActivityRequest,
            from: {
                id: webchatActivityRequest.from.id,
                channelId: conversation.createdByChannel,
                data: webchatActivityRequest.from.data,
            },
            to: {
                id: webchatActivityRequest.from.data.botId,
                data: {},
                channelId: toChannelId,
            },
            hash: this.getWebchatMessageHash(webchatActivityRequest),
            timestamp: moment().utc(false).valueOf() as any,
        } as ActivityDto;
    }

    private getWebchatMessageHash(webchatActivityRequest: CreateWebchatActivity) {
        return v4();
    }

    async getConversation(conversationId: string) {
        const conversation = await this.conversationService.getOne(conversationId);
        return this.getWebchatConversation(conversation);
    }

    async createAndUpload(file, conversationId, memberId) {
        return await this.attachmentService.createAndUpload(file, conversationId, memberId);
    }
}
