import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from './../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { RolesGuard } from '../../users/guards/roles.guard';
import { DeleteTeamService } from './delete-team.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Teams')
@Controller('workspaces/:workspaceId')
export class DeleteTeamController {
    constructor(private readonly deleteTeamService: DeleteTeamService) {}

    @Delete('teams/:teamId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async deleteTeam(@Param('teamId') teamId: string) {
        return await this.deleteTeamService.deleteTeam(teamId);
    }
}
