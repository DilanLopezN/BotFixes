import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConversationService } from '../../conversation/services/conversation.service';
import { Identity } from '../../conversation/interfaces/conversation.interface';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { ConversationCategorizationService } from '../../conversation-categorization-v2/services/conversation-categorization.service';
import { CreateConversationCategorizationParams } from '../../conversation-categorization-v2/interfaces/create-conversation-categorization.interface';
import { SmtRe } from '../models/smt-re.entity';
import { ActivityType, ConversationCloseType } from 'kissbot-core';

@Injectable()
export class ExternalDataService {
    private conversationService: ConversationService;
    private workspaceService: WorkspacesService;
    private conversationCategorizationService: ConversationCategorizationService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
    }

    async getConversationById(conversationId: string) {
        const result = await this.conversationService.getOne(conversationId);
        return result;
    }

    async addTags(conversationId: string, tags: { name: string; color: string }[]) {
        return await this.conversationService.addTags(conversationId, tags);
    }

    async dispatchMessageActivity(conversation, activity) {
        await this.conversationService.dispatchMessageActivity(conversation, activity);
    }

    async addMember(conversationId, member) {
        await this.conversationService.addMember(conversationId, member);
    }

    async sendStmReActivity(smtRe: SmtRe, type: ActivityType) {
        await this.conversationService.sendStmReActivity(smtRe, type);
    }

    async dispatchEndConversationActivity(conversationId: string, botMember: Identity, data: any) {
        await this.conversationService.dispatchEndConversationActivity(conversationId, botMember, data);
    }

    async updateConversationIsWithSmtRe(conversationId: string) {
        await this.conversationService.updateConversationIsWithSmtRe(conversationId);
    }

    async createConversationCategorization(
        workspaceId: string,
        conversationId: string,
        memberId: string,
        data: CreateConversationCategorizationParams,
        closeType?: ConversationCloseType,
        feature?: string,
    ) {
        return await this.conversationService.closeConversationWithCategorization(
            workspaceId,
            conversationId,
            memberId,
            data,
            closeType,
            feature,
        );
    }

    async getWorkspace(workspaceId: string) {
        return await this.workspaceService.findOne({ _id: workspaceId });
    }
}
