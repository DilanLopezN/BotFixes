import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InteractionsService } from '../../interactions/services/interactions.service';

@Injectable()
export class ExternalDataService {
    private interactionsService: InteractionsService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
    }

    async setBotInteractionToCache(botId: string) {
        return await this.interactionsService.setBotInteractionToCache(botId);
    }

    async initBotInteraction(workspaceId, botId: string) {
        return await this.interactionsService.initBotInteraction(workspaceId, botId);
    }

    async publish(botId: string, workspaceId: string, userId: string, comment?: string) {
        return await this.interactionsService.publish(botId, workspaceId, userId, comment);
    }
}
