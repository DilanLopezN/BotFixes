import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { FixedResponsesWelcome } from '../../interactions/interfaces/response.interface';

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

    async updateInteractionWelcome(workspaceId: string) {
        return await this.interactionsService.updateWelcomeInteractionWithFixedResponse(
            workspaceId,
            FixedResponsesWelcome.REASSIGN_CONVERSATION,
        );
    }
}
