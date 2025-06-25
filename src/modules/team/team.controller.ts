import { UserDecorator } from './../../decorators/user.decorator';
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from './../../common/utils/utils';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { TeamService } from './services/team.service';
import { User } from 'kissbot-core';
import { ApiTags } from '@nestjs/swagger';
import { OffDaysPeriod } from './interfaces/team.interface';

@ApiTags('Teams')
@Controller('workspaces/:workspaceId')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Get('teams/:teamId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getTeam(@Param('teamId') teamId: string, @Param('workspaceId') workspaceId: string) {
        return await this.teamService.findOne({
            workspaceId,
            _id: teamId,
        });
    }

    @Get('teams')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getTeams(
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }],
        })
        query: any,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.teamService._queryPaginate(query, user, workspaceId);
    }

    @Post('teams')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createTeam(@Param('workspaceId') workspaceId: string, @Body() body: CreateTeamDto) {
        return await this.teamService.createTeam(workspaceId, body);
    }

    @Put('teams/:teamId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateTeam(
        @Param('workspaceId') workspaceId: string,
        @Param('teamId') teamId: string,
        @Body() body: UpdateTeamDto,
        @UserDecorator() authUser: User,
    ) {
        return await this.teamService.updateTeam(workspaceId, authUser._id, teamId, body);
    }

    @Post('teams/createOffDays')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createOffDays(@Body() body: { teamIds: string[]; offDay: OffDaysPeriod }, @UserDecorator() authUser: User) {
        return await this.teamService.createOffDayTeams(body.teamIds, body.offDay, authUser._id);
    }

    @Get('team-list/listTeamsCanSendMultipleMessage')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listTeamsCanSendMultipleMessage(
        @Query('resultBoolean') resultBoolean: boolean,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        const result = await this.teamService.listTeamsCanSendMultipleMessage(workspaceId, user as any);

        if (resultBoolean) {
            return !!result?.length;
        }

        return result;
    }
}
