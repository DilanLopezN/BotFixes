import { BadRequestException, Injectable } from '@nestjs/common';
import { Activity } from './../interfaces/activity';
import { set } from 'lodash';
import { Conversation } from './../../conversation/interfaces/conversation.interface';
import { omit } from 'lodash';
import { Types } from 'mongoose';
import { ActivityType, IdentityType } from 'kissbot-core';
import * as moment from 'moment';

@Injectable()
export class ActivityUtilService {
    getTime(timeType: 'hour' | 'minute', time: number) {
        if (timeType == 'hour') {
            return time * 3600000;
        }
        return time * 60000;
    }

    getPropertiesValues(o, scope = [], result = {}) {
        for (let i in o) {
            if (o[i] !== null && typeof o[i] === 'object') {
                this.getPropertiesValues(o[i], scope.concat(i), result);
            } else {
                if (scope.length > 0) {
                    result[scope.join('.') + '.' + i] = o[i];
                } else {
                    result['' + i] = o[i];
                }
            }
        }
    }

    buildUpdateQuery(oldObject, newObject) {
        const updateQuery = {};

        this.getPropertiesValues(newObject, [], updateQuery);

        for (let k in updateQuery) {
            set(oldObject, k, updateQuery[k]);
        }

        if (Object.keys(updateQuery).length > 0) {
            const update = {
                $set: {
                    ...updateQuery,
                },
            };
            return update;
        } else {
            return null;
        }
    }

    getOrder(priority, order, time): number {
        if (!priority || priority == 0) {
            priority = 1;
        }

        let sum = order + time;
        if (sum <= 0) {
            sum = 1;
        }

        return sum / priority;
    }

    async getCompleteActivityObject(activityRequest, conversation: Partial<Conversation>): Promise<Activity> {
        if (!activityRequest.from || !activityRequest.from.id) {
            console.log('Activity request missing from field', JSON.stringify(activityRequest));
            throw new BadRequestException("Activity request missing 'from' field");
        }

        if (activityRequest.to?.id) {
            const to = conversation.members.find((mem) => mem.id === activityRequest.to.id);

            activityRequest.to = {
                ...to,
                data: omit(activityRequest.to.data, 'track'),
            };
        }

        const activityId = new Types.ObjectId();
        if (activityRequest.from?.id) {
            const from = conversation.members.find((mem) => mem.id === activityRequest.from.id);

            activityRequest.from = {
                ...from,
                data: omit(activityRequest.from.data, 'track'),
            };

            if (activityRequest.from?.avatar?.length > 250) {
                activityRequest.from.avatar = '';
            }

            if (!activityRequest?.attachmentFile && !!activityRequest?.attachments?.length) {
                const attachment = activityRequest.attachments[0];
                if (attachment?.contentType && attachment?.contentUrl) {
                    activityRequest.attachmentFile = {
                        contentType: attachment.contentType,
                        contentUrl: attachment.contentUrl,
                        name: attachment?.name || 'image',
                        key: activityId.toString(),
                        id: activityId.toString(),
                    };
                }
            }
        }
        return {
            ...activityRequest,
            channelId: activityRequest.from.channelId,
            serviceUrl: process.env.CHAT_SOCKET_URI,
            conversationId: conversation._id,
            workspaceId: conversation.workspace ? conversation.workspace._id : null,
            botId: conversation.bot ? conversation.bot._id : null,
            createdAt: new Date(),
            _id: activityId,
        } as Activity;
    }

    async updateExpiresAt(
        activity: Activity,
        conversation: Conversation,
        updatedConversation: Conversation,
        now: number,
    ) {
        // O proprio método que envia o evento que fica responsável por fazer essas alteracoes.
        if (
            activity.type != ActivityType.message &&
            activity.type != ActivityType.member_upload_attachment &&
            activity.type != ActivityType.rating_message
        ) {
            return;
        }

        if (IdentityType.user == activity.from.type) {
            updatedConversation.expiresAt = moment(now + conversation.expirationTime).startOf('minute').valueOf();
            updatedConversation.beforeExpiresAt = moment(now + conversation.beforeExpirationTime).startOf('minute').valueOf();
        } else if (
            activity.from &&
            IdentityType.system != activity.from.type &&
            IdentityType.bot != activity.from.type
        ) {
            updatedConversation.expiresAt = 0;
            updatedConversation.beforeExpiresAt = 0;
        }

        if (conversation.expiresAt == updatedConversation.expiresAt) {
            delete updatedConversation.expiresAt;
        }

        if (conversation.beforeExpiresAt == updatedConversation.beforeExpiresAt) {
            delete updatedConversation.beforeExpiresAt;
        }

        if (isNaN(updatedConversation.beforeExpiresAt)) {
            delete updatedConversation.beforeExpiresAt;
        }

        if (isNaN(updatedConversation.expiresAt)) {
            delete updatedConversation.expiresAt;
        }
    }
}
