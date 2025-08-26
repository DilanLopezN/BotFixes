import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { castObjectIdToString } from '../../../common/utils/utils';
import { TeamService } from '../../../modules/team/services/team.service';

@Injectable()
export class ExternalDataAgentStatusService {
    private teamService: TeamService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
    }

    async getTeamIdsByWorkspaceAndUser(workspaceId: string, userId: string) {
        const teams = await this.teamService.getTeamsByWorkspaceAndUser(workspaceId, userId);

        return teams.map((team) => castObjectIdToString(team._id));
    }
}
