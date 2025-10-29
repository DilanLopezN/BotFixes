import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InteractionsService } from '../../interactions/services/interactions.service';

@Injectable()
export class ExternalDataService {
    private _interactionsService: InteractionsService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get interactionsService(): InteractionsService {
        if (!this._interactionsService) {
            this._interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
        }
        return this._interactionsService;
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
