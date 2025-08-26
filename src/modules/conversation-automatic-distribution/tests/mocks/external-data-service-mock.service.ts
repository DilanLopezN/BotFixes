import { Injectable } from '@nestjs/common';
import { IdentityType } from 'kissbot-core';
import * as mongoose from 'mongoose';
import { v4 } from 'uuid';

@Injectable()
export class ExternalDataServiceMock {
    static workspaceId = new mongoose.Types.ObjectId();
    static teamId = new mongoose.Types.ObjectId();
    static agentId1 = v4();
    static agentId2 = v4();
    static agentId3 = v4();

    static conversations = {
        conv1: {
            _id: new mongoose.Types.ObjectId(),
            state: 'open',
            members: [
                { type: IdentityType.system, id: 'system', name: 'system' },
                { type: IdentityType.user, id: 'user1', name: 'User 1' },
            ],
            activities: [],
        },
        conv2: {
            _id: new mongoose.Types.ObjectId(),
            state: 'open',
            members: [{ type: IdentityType.user, id: 'user2', name: 'User 2' }],
            activities: [],
        },
    };

    static teams = {
        [ExternalDataServiceMock.teamId.toString()]: {
            _id: ExternalDataServiceMock.teamId,
            name: 'Test Team',
            roleUsers: [
                { userId: ExternalDataServiceMock.agentId1, permission: { canViewHistoricConversation: false } },
                { userId: ExternalDataServiceMock.agentId2, permission: { canViewHistoricConversation: false } },
                { userId: v4(), permission: { canViewHistoricConversation: true } }, // supervisor (should be filtered out)
            ],
            toJSON: function () {
                return this;
            },
        },
    };

    static users = [
        {
            _id: ExternalDataServiceMock.agentId1,
            name: 'Agent 1',
            email: 'agent1@test.com',
        },
        {
            _id: ExternalDataServiceMock.agentId2,
            name: 'Agent 2',
            email: 'agent2@test.com',
        },
        {
            _id: ExternalDataServiceMock.agentId3,
            name: 'Agent 3',
            email: 'agent3@test.com',
        },
    ];

    async getConversationById(conversationId: string) {
        return (
            ExternalDataServiceMock.conversations[conversationId] ||
            Object.values(ExternalDataServiceMock.conversations).find((conv) => conv._id.toString() === conversationId)
        );
    }

    async addMember(conversationId: string, member: any) {
        const conversation = await this.getConversationById(conversationId);
        if (conversation) {
            conversation.members.push(member);
        }
    }

    async dispatchMessageActivity(conversation: any, activity: any) {
        const conv = Object.values(ExternalDataServiceMock.conversations).find(
            (c) => c._id.toString() === conversation._id.toString(),
        );
        if (conv) {
            conv.activities.push(activity);
        }
    }

    async transferConversationToAgent(conversationId: string, agentId: string): Promise<void> {
        // Mock implementation - in real service this would transfer the conversation
        const conversation = await this.getConversationById(conversationId);
        if (conversation) {
            // Add agent as member
            conversation.members.push({
                type: IdentityType.agent,
                id: agentId,
                name: `Agent ${agentId}`,
            });
        }
    }

    async getUsersByQuery(query: any) {
        if (query._id && query._id.$in) {
            return ExternalDataServiceMock.users.filter((user) => query._id.$in.includes(user._id.toString()));
        }
        return ExternalDataServiceMock.users;
    }

    async getTeamById(teamId: string) {
        return ExternalDataServiceMock.teams[teamId];
    }

    getConversationModel() {
        return {
            schema: 'mock-conversation-model',
        };
    }

    async getUserConversationCounts(userIds: string[], workspaceId: string): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        // Mock conversation counts for testing
        userIds.forEach((userId, index) => {
            if (userId === ExternalDataServiceMock.agentId1) {
                counts.set(userId, 3);
            } else if (userId === ExternalDataServiceMock.agentId2) {
                counts.set(userId, 1);
            } else if (userId === ExternalDataServiceMock.agentId3) {
                counts.set(userId, 5);
            } else {
                counts.set(userId, Math.floor(Math.random() * 10));
            }
        });

        return counts;
    }
}
