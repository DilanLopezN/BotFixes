import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TeamService } from '../../team/services/team.service';
import { IntentsService } from '../../intents/services/intents.service';
import { IntentsInterface } from '../../../modules/intents/interfaces/intents.interface';

@Injectable()
export class ExternalDataService {
    private teamService: TeamService;
    private intentsService: IntentsService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        this.intentsService = this.moduleRef.get<IntentsService>(IntentsService, { strict: false });
    }

    async getTeamById(teamId: string) {
        return await this.teamService.getOne(teamId);
    }

    async getIntentsByWorkspaceIdAndBotId(workspaceId: string, botId: string): Promise<IntentsInterface[]> {
        return await this.intentsService.getIntentsByWorkspaceAndBot(workspaceId, botId);
    }
}
