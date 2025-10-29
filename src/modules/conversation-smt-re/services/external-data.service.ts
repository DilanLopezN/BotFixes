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
    private _conversationService: ConversationService;
    private _workspaceService: WorkspacesService;
    private _conversationCategorizationService: ConversationCategorizationService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get conversationService(): ConversationService {
        if (!this._conversationService) {
            this._conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
        }
        return this._conversationService;
    }

    private get workspaceService(): WorkspacesService {
        if (!this._workspaceService) {
            this._workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        }
        return this._workspaceService;
    }

    private get conversationCategorizationService(): ConversationCategorizationService {
        if (!this._conversationCategorizationService) {
            this._conversationCategorizationService = this.moduleRef.get<ConversationCategorizationService>(ConversationCategorizationService, { strict: false });
        }
        return this._conversationCategorizationService;
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
