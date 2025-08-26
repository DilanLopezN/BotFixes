import { Body, Controller, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { WorkingTimeService } from '../services/working-time.service';
import { StartBreakDto } from '../dto/start-break.dto';
import { WorkingTime } from '../models/working-time.entity';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { castObjectIdToString, PredefinedRoles } from '../../../common/utils/utils';
import { User } from '../../users/interfaces/user.interface';
import { UserDecorator } from '../../../decorators/user.decorator';
import { endBreakDto } from '../dto/end-break.dto';
import { AgentStatusFeatureFlagGuard } from '../guards/agent-status-feature-flag.guard';
import { BulkBreakChangeByAdminDto } from '../dto/bulk-break-change-by-admin.dto';
import { AgentStatusFeatureFlagForAgentsGuard } from '../guards/agent-status-feature-flag-for-agents.guard';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { DefaultResponse } from '../../../common/interfaces/default';

@ApiTags('Working time')
@ApiBearerAuth()
@Controller('/workspaces/:workspaceId/agentStatus')
@UseGuards(AuthGuard, AgentStatusFeatureFlagGuard)
export class WorkingTimeController {
    constructor(private readonly workingTimeService: WorkingTimeService) {}

    @Post('workingTimeConnect')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard, AgentStatusFeatureFlagForAgentsGuard)
    @RolesDecorator([PredefinedRoles.WORKSPACE_AGENT])
    async connect(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<WorkingTime>> {
        const result = await this.workingTimeService.connect(workspaceId, castObjectIdToString(user._id));

        return { data: result };
    }

    @Post('workingTimeDisconnect')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard, AgentStatusFeatureFlagForAgentsGuard)
    @RolesDecorator([PredefinedRoles.WORKSPACE_AGENT])
    async disconnect(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<WorkingTime>> {
        const result = await this.workingTimeService.disconnect(workspaceId, castObjectIdToString(user._id));

        return { data: result };
    }

    @Post('workingTimeStartBreak')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard, AgentStatusFeatureFlagForAgentsGuard)
    @RolesDecorator([PredefinedRoles.WORKSPACE_AGENT])
    async startBreak(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        body: StartBreakDto,
    ): Promise<DefaultResponse<WorkingTime>> {
        const result = await this.workingTimeService.startBreak(
            workspaceId,
            castObjectIdToString(user._id),
            body.breakSettingId,
        );

        return { data: result };
    }

    @Post('workingTimeEndBreakAndConnect')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard, AgentStatusFeatureFlagForAgentsGuard)
    @RolesDecorator([PredefinedRoles.WORKSPACE_AGENT])
    async endBreakAndConnect(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        body: endBreakDto,
    ): Promise<DefaultResponse<WorkingTime>> {
        const result = await this.workingTimeService.endBreakAndConnect(
            workspaceId,
            castObjectIdToString(user._id),
            body.justification,
        );

        return { data: result };
    }

    @Post('workingTimeGetUserStatus')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.WORKSPACE_AGENT])
    async getUserStatus(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<WorkingTime> | DefaultResponse<{ offline: boolean }>> {
        const result = await this.workingTimeService.findActiveByUserAndWorkspaceId(
            workspaceId,
            castObjectIdToString(user._id),
        );

        if (!result) {
            return { data: { offline: true } };
        }

        return { data: result };
    }

    @Post('workingTimeBulkChangeBreak')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @ApiBody({
        description: 'Create bulk working time',
        type: BulkBreakChangeByAdminDto,
    })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async BulkChangeBreakByAdmin(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        body: BulkBreakChangeByAdminDto,
    ): Promise<DefaultResponse<{ success: boolean }>> {
        const result = await this.workingTimeService.bulkBreakChangeByAdmin(workspaceId, body, user);

        return { data: result };
    }
}
