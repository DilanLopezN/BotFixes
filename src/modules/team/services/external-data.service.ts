import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { FixedResponsesWelcome } from '../../interactions/interfaces/response.interface';

@Injectable()
export class ExternalDataService {
    private interactionsService: InteractionsService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
    }

    async updateInteractionWelcome(workspaceId: string) {
        return await this.interactionsService.updateWelcomeInteractionWithFixedResponse(
            workspaceId,
            FixedResponsesWelcome.REASSIGN_CONVERSATION,
        );
    }
}
