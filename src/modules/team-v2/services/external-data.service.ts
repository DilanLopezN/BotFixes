import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UsersService } from '../../users/services/users.service';
import { FixedResponsesWelcome } from '../../../modules/interactions/interfaces/response.interface';
import { InteractionsService } from '../../interactions/services/interactions.service';

@Injectable()
export class ExternalDataService {
    private _usersService: UsersService;
    private _interactionsService: InteractionsService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get usersService(): UsersService {
        if (!this._usersService) {
            this._usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
        }
        return this._usersService;
    }

    private get interactionsService(): InteractionsService {
        if (!this._interactionsService) {
            this._interactionsService = this.moduleRef.get<InteractionsService>(InteractionsService, { strict: false });
        }
        return this._interactionsService;
    }

    async getUser(userId: string, workspaceId?: string) {
        return await this.usersService.getOne(userId, workspaceId)
    }

    async getUsers(usersId: string[], workspaceId: string, fields?: string) {
        return await this.usersService.getUsers(usersId, workspaceId, fields)
    }

    async updateInteractionWelcome(workspaceId: string) {
        return await this.interactionsService.updateWelcomeInteractionWithFixedResponse(
            workspaceId,
            FixedResponsesWelcome.REASSIGN_CONVERSATION,
        );
    }
}
