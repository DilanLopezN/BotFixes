import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { castObjectIdToString } from '../../../../common/utils/utils';
import { TeamService } from '../../../../modules/team-v2/services/team.service';
import { UsersService } from '../../../../modules/users/services/users.service';

@Injectable()
export class ExternalDataService {
    private _teamService: TeamService;
    private _usersService: UsersService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get teamService(): TeamService {
        if (!this._teamService) {
            this._teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        }
        return this._teamService;
    }

    private get usersService(): UsersService {
        if (!this._usersService) {
            this._usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
        }
        return this._usersService;
    }

    async getUsersOnTeam(workspaceId: string, teamId: string) {
        return await this.teamService.getUsersOnTeam(workspaceId, teamId);
    }

    async getUsersByIds(userIds: string[]) {
        const result = await this.usersService.getUsersByIds(userIds);

        return result?.map((user) => ({ _id: castObjectIdToString(user._id), name: user.name }));
    }

    async getAllActiveUsersAgentByWorkspaceId(workspaceId: string) {
        const result = await this.usersService.getAllActiveUsersAgentByWorkspaceId(workspaceId);

        return result?.map((user) => ({ _id: castObjectIdToString(user._id), name: user.name }));
    }
}
