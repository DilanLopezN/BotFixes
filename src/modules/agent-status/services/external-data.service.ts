import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { castObjectIdToString } from '../../../common/utils/utils';
import { TeamService } from '../../../modules/team/services/team.service';

@Injectable()
export class ExternalDataAgentStatusService {
    private _teamService: TeamService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get teamService(): TeamService {
        if (!this._teamService) {
            this._teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        }
        return this._teamService;
    }

    async getTeamIdsByWorkspaceAndUser(workspaceId: string, userId: string) {
        const teams = await this.teamService.getTeamsByWorkspaceAndUser(workspaceId, userId);

        return teams.map((team) => castObjectIdToString(team._id));
    }
}
