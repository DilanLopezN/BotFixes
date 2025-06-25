import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConversationService } from '../../conversation/services/conversation.service';
import { Identity } from '../../conversation/interfaces/conversation.interface';

@Injectable()
export class ExternalDataService {
    private conversationService: ConversationService;

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

    async dispatchEndConversationActivity(conversationId: string, botMember: Identity, data: any) {
        await this.conversationService.dispatchEndConversationActivity(conversationId, botMember, data);
    }

    async updateConversationIsWithSmtRe(conversationId: string) {
        await this.conversationService.updateConversationIsWithSmtRe(conversationId);
    }
}
