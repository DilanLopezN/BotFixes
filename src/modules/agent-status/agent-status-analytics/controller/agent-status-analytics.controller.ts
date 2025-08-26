import { Body, Controller, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import {
    AgentStatusAnalyticsFilterDto,
    AgentStatusAnalyticsFilterListBreakOvertimeDto,
} from '../dto/agent-status-analytics-filter.dto';
import { AgentStatusAnalyticsService } from '../service/agent-status-analytics.service';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { AgentStatusFeatureFlagGuard } from '../../guards/agent-status-feature-flag.guard';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { DefaultRequest, DefaultResponse } from '../../../../common/interfaces/default';
import {
    AgentStatusResponse,
    AgentTimeAggregation,
    AgentTimeAggregationTotal,
} from '../interface/agent-status-analytics.interface';
import { WorkingTime } from '../../models/working-time.entity';

@ApiTags('Analytics agent status')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/agentStatusAnalytics')
@UseGuards(AuthGuard, AgentStatusFeatureFlagGuard)
export class AgentStatusAnalyticsController {
    constructor(private readonly agentStatusAnalyticsService: AgentStatusAnalyticsService) {}

    @Post('/getAgentStatus')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getAgentStatus(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        filterDto: AgentStatusAnalyticsFilterDto,
    ): Promise<DefaultResponse<AgentStatusResponse>> {
        const result = await this.agentStatusAnalyticsService.getAgentStatus(
            workspaceId,
            filterDto.teamId,
            filterDto.userId,
        );

        return { data: result };
    }

    @Post('/getOnlineTime')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getOnlineTime(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        filterDto: AgentStatusAnalyticsFilterDto,
    ): Promise<DefaultResponse<AgentTimeAggregation[]>> {
        const result = await this.agentStatusAnalyticsService.getOnlineTime(
            workspaceId,
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
            filterDto.groupDateBy,
            filterDto.groupBy,
        );

        return { data: result };
    }

    @Post('/getTotalOnlineTime')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getTotalOnlineTime(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        filterDto: AgentStatusAnalyticsFilterDto,
    ): Promise<DefaultResponse<AgentTimeAggregationTotal>> {
        const result = await this.agentStatusAnalyticsService.getTotalOnlineTime(
            workspaceId,
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
        );

        return { data: result };
    }

    @Post('/getBreakOvertime')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getBreakOvertime(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        filterDto: AgentStatusAnalyticsFilterDto,
    ): Promise<DefaultResponse<AgentTimeAggregation[]>> {
        const result = await this.agentStatusAnalyticsService.getBreakOvertime(
            workspaceId,
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
            filterDto.groupDateBy,
            filterDto.groupBy,
        );

        return { data: result };
    }

    @Post('/getTotalBreakOvertime')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getTotalBreakOvertime(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        filterDto: AgentStatusAnalyticsFilterDto,
    ): Promise<DefaultResponse<AgentTimeAggregationTotal>> {
        const result = await this.agentStatusAnalyticsService.getTotalBreakOvertime(
            workspaceId,
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
        );

        return { data: result };
    }

    @Post('/getAverageBreakTime')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getAverageBreakTime(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        filterDto: AgentStatusAnalyticsFilterDto,
    ): Promise<DefaultResponse<AgentTimeAggregation[]>> {
        const result = await this.agentStatusAnalyticsService.getAverageBreakTime(
            workspaceId,
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
            filterDto.groupDateBy,
            filterDto.groupBy,
        );

        return { data: result };
    }

    @Post('/getTotalBreakTime')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getTotalAverageBreakTime(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        filterDto: AgentStatusAnalyticsFilterDto,
    ): Promise<DefaultResponse<AgentTimeAggregationTotal>> {
        const result = await this.agentStatusAnalyticsService.getTotalAverageBreakTime(
            workspaceId,
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
        );

        return { data: result };
    }

    @Post('/getListBreakOvertime')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getListBreakOvertime(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                transform: true,
            }),
        )
        payload: DefaultRequest<AgentStatusAnalyticsFilterListBreakOvertimeDto>,
    ): Promise<DefaultResponse<Partial<WorkingTime>[]>> {
        const { data, limit, skip } = payload;
        const filterDto = data as AgentStatusAnalyticsFilterListBreakOvertimeDto;
        const result = await this.agentStatusAnalyticsService.getListBreakOvertime(
            workspaceId,
            { limit, skip },
            filterDto.startDate,
            filterDto.endDate,
            filterDto.teamId,
            filterDto.userId,
            filterDto.breakSettingId ? Number(filterDto.breakSettingId) : null,
        );

        return result;
    }
}
