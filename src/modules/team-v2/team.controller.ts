import { Controller, Param, Post, Body, UseGuards, Query } from '@nestjs/common';
import { PredefinedRoles } from './../../common/utils/utils';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { TeamService } from './services/team.service';
import { ApiTags } from '@nestjs/swagger';
import { SimplifiedTeam } from './interfaces/simplified-team.interface';
import { Team } from './interfaces/team.interface';
import { CreateTeamParams } from './interfaces/create-team.interface';
import { UpdateTeamParams } from './interfaces/update-team.interface';
import { UserDecorator } from './../../decorators/user.decorator';
import { User } from 'kissbot-core';
import { DefaultRequest, DefaultResponse } from '../../common/interfaces/default';
import { DoInactiveTeamParams } from './interfaces/do-inactive-team.interface';
import { DoDeleteTeamParams } from './interfaces/do-delete-team.interface';
import { GetTeamParams } from './interfaces/get-team.interface';
import { UpdateTeamResponse } from './interfaces/update-team-response.interface';
import { DoReactivateTeamParams } from './interfaces/do-reactive-team.interface';

@ApiTags('Teams')
@Controller('workspaces/:workspaceId/teams')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Post('listTeamsSimplified')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listTeamsSimplified(
        @Param('workspaceId') workspaceId: string,
        @Body('usersLimit') usersLimit?: number,
        @Query('search') search?: string,
    ): Promise<DefaultResponse<SimplifiedTeam[]>> {
        return await this.teamService.listSimplified(workspaceId, usersLimit, search);
    }

    @Post('doInactiveTeam')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async doInactiveTeam(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<DoInactiveTeamParams>,
    ): Promise<DefaultResponse<Team>> {
        return await this.teamService.doInactiveTeam(workspaceId, body.data.teamId);
    }

    @Post('doDeleteTeam')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async doDeleteTeam(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<DoDeleteTeamParams>,
        @UserDecorator() authUser: User,
    ): Promise<DefaultResponse<Team>> {
        return await this.teamService.doDeleteTeam(workspaceId, authUser._id, body.data.teamId);
    }

    @Post('getTeam')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getTeam(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<GetTeamParams>,
    ): Promise<DefaultResponse<Team>> {
        return await this.teamService.getTeam(workspaceId, body.data.teamId);
    }

    @Post('createTeam')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createTeam(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<CreateTeamParams>,
    ): Promise<DefaultResponse<Team>> {
        return await this.teamService.createTeam(workspaceId, body.data);
    }

    @Post('updateTeam')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateTeam(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<UpdateTeamParams>,
        @UserDecorator() authUser: User,
    ): Promise<UpdateTeamResponse> {
        return await this.teamService.updateTeam(workspaceId, authUser._id, body.data);
    }

    @Post('doReactivateTeam')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async doReactivateTeam(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<DoReactivateTeamParams>,
    ): Promise<DefaultResponse<Team>> {
        return await this.teamService.doReactivateTeam(workspaceId, body.data.teamId);
    }
}
