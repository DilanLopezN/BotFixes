import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TeamService } from '../../team/services/team.service';
import { IntentsService } from '../../intents/services/intents.service';
import { IntentsInterface } from '../../../modules/intents/interfaces/intents.interface';

@Injectable()
export class ExternalDataService {
    private _teamService: TeamService;
    private _intentsService: IntentsService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get teamService(): TeamService {
        if (!this._teamService) {
            this._teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        }
        return this._teamService;
    }

    private get intentsService(): IntentsService {
        if (!this._intentsService) {
            this._intentsService = this.moduleRef.get<IntentsService>(IntentsService, { strict: false });
        }
        return this._intentsService;
    }

    async getTeamById(teamId: string) {
        return await this.teamService.getOne(teamId);
    }

    async getIntentsByWorkspaceIdAndBotId(workspaceId: string, botId: string): Promise<IntentsInterface[]> {
        return await this.intentsService.getIntentsByWorkspaceAndBot(workspaceId, botId);
    }
}
