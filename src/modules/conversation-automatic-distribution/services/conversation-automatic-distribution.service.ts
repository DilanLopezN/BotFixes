import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION } from '../ormconfig';
import { ConversationAutomaticDistribution } from '../models/conversation-automatic-distribution.entity';
import { KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { KissbotEvent } from 'kissbot-core';

@Injectable()
export class ConversationAutomaticDistributionService {
    constructor(
        @InjectRepository(ConversationAutomaticDistribution, CONVERSATION_AUTOMATIC_DISTRIBUTION_CONNECTION)
        private conversationAutomaticDistributionRepository: Repository<ConversationAutomaticDistribution>,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
        routingKey: [
            KissbotEventType.CONVERSATION_CLOSED,
            KissbotEventType.CONVERSATION_ASSIGNED,
            KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
        ],
        queue: getQueueName('conversation-automatic-distribution-consumer'),
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: ConversationAutomaticDistributionService.name,
        },
    })
    private async processConversation(event: KissbotEvent): Promise<void> {
        try {
            await this.processEvent(event);
        } catch (error) {
            console.log('ConversationAutomaticDistributionService.processConversation', error);
        }
    }

    private async processEvent(event: KissbotEvent): Promise<void> {
        const eventData = event.data as any;

        switch (event.type) {
            case KissbotEventType.CONVERSATION_CLOSED:
                return await this.removeConversationAutomaticDistribution(eventData);

            case KissbotEventType.CONVERSATION_MEMBERS_UPDATED:
                return await this.updateConversationDistribution(eventData);

            case KissbotEventType.CONVERSATION_ASSIGNED:
                return await this.handleConversationAssigned(eventData);
        }
    }

    private async handleConversationAssigned(event: any): Promise<void> {
        const existingRecord = await this.getConversationAutomaticDistribution(event);

        if (existingRecord) {
            await this.updateConversationDistribution(event, existingRecord);
        } else {
            await this.createConversationAutomaticDistribution(event);
        }
    }

    private async updateConversationDistribution(
        event: any,
        existingRecord?: ConversationAutomaticDistribution,
    ): Promise<void> {
        if (!existingRecord) {
            existingRecord = await this.getConversationAutomaticDistribution(event);
        }

        if (!existingRecord) {
            return;
        }

        const newTeamId = event.team?._id || event.teamId;
        const hasActiveAgent = event.members?.some((member: any) => member.type === 'agent' && !member.disabled);

        const updateData: Partial<ConversationAutomaticDistribution> = {};

        if (newTeamId && existingRecord.teamId !== newTeamId) {
            updateData.teamId = newTeamId;
        }

        if (hasActiveAgent) {
            updateData.hasMember = true;
        } else {
            updateData.hasMember = false;
        }

        if (Object.keys(updateData).length > 0) {
            await this.conversationAutomaticDistributionRepository.update(existingRecord.id, updateData);
        }
    }

    private async createConversationAutomaticDistribution(event: any): Promise<ConversationAutomaticDistribution> {
        const hasMember = event.conversation?.members?.some(
            (member: any) => member.type === 'agent' && !member.disabled,
        );

        const conversationAutomaticDistribution = new ConversationAutomaticDistribution();

        conversationAutomaticDistribution.conversationId = event.conversationId || event._id;
        conversationAutomaticDistribution.workspaceId =
            event.workspace?._id || event.workspaceId || event.team?.workspaceId;
        conversationAutomaticDistribution.teamId = event.team?._id || event.teamId;
        conversationAutomaticDistribution.state = event.conversation?.state;
        conversationAutomaticDistribution.order = event.conversation?.order;
        conversationAutomaticDistribution.priority = event.conversation?.priority;
        conversationAutomaticDistribution.hasMember = hasMember;
        conversationAutomaticDistribution.createdAt = new Date();

        return this.conversationAutomaticDistributionRepository.save(conversationAutomaticDistribution);
    }

    private async getConversationAutomaticDistribution(event: any): Promise<ConversationAutomaticDistribution | null> {
        return this.conversationAutomaticDistributionRepository.findOne({
            where: {
                workspaceId: event.workspaceId || event.workspace?._id,
                conversationId: event.conversationId || event.conversation?._id || event._id,
            },
        });
    }

    private async removeConversationAutomaticDistribution(event: any): Promise<void> {
        const existingRecord = await this.getConversationAutomaticDistribution(event);

        if (existingRecord) {
            await this.conversationAutomaticDistributionRepository.remove(existingRecord);
        }
    }

    async getConversationsByWorkspaceId(workspaceId: string) {
        return await this.conversationAutomaticDistributionRepository.find({
            where: {
                workspaceId: workspaceId,
                hasMember: false,
            },
            order: {
                createdAt: 'ASC',
                order: 'ASC',
            },
        });
    }
}
