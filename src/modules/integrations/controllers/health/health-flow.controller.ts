import { Controller, Get, Post, Body, Put, Param, Delete, ValidationPipe, UseGuards } from '@nestjs/common';
import { QueryStringDecorator } from '../../../../decorators/queryString.decorator';
import { HealthFlowService } from '../../services/health/health-flow.service';
import { CreateHealthFlowDto } from '../../dto/health/health-flow.dto';
import { AuthGuard } from '../../../../modules/auth/guard/auth.guard';
import * as moment from 'moment';
import { User } from 'kissbot-core';
import { UserDecorator } from '../../../../decorators/user.decorator';
import { userAccessLatency } from '../../../../common/utils/prom-metrics';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { IntegrationEnabledGuard } from '../../guards/integration_enabled.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Health Flows')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('workspaces/:workspaceId/integrations/:integrationType')
export class HealthFlowController {
    constructor(private readonly healthFlowService: HealthFlowService) {}

    @Post(':integrationId/health-flows')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async createFlow(
        @Body(new ValidationPipe()) dto: CreateHealthFlowDto,
        @Param('workspaceId') workspaceId: string,
        @Param('integrationId') integrationId: string,
        @UserDecorator() user: User,
    ) {
        const timer = userAccessLatency.labels(user.name, 'create_flow', workspaceId).startTimer();

        const result = await this.healthFlowService._create({
            ...dto,
            workspaceId,
            createdAt: moment().valueOf(),
            integrationId,
        });
        timer();
        return result;
    }

    @Post(':integrationId/health-flows/sync')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async syncFlows(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthFlowService.sync(integrationId, workspaceId, user._id);
    }

    @Post(':integrationId/health-flows/sync-one/:flowId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async syncOneFlow(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @Param('flowId') flowId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthFlowService.syncOne(integrationId, workspaceId, flowId, user._id);
    }

    @Post(':integrationId/health-flows/sync-force')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async syncForceFlows(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthFlowService.forceSyncFlow(integrationId, workspaceId, user._id);
    }

    @Post(':integrationId/health-flows/sync-draft')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async syncDraftFlows(@Param('integrationId') integrationId: string, @Param('workspaceId') workspaceId: string) {
        return await this.healthFlowService.syncDraft(integrationId, workspaceId);
    }

    @Post(':integrationId/health-flows/sync-one-draft/:flowId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async syncOneDraftFlow(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @Param('flowId') flowId: string,
    ) {
        return await this.healthFlowService.syncOneDraft(integrationId, workspaceId, flowId);
    }

    @Get(':integrationId/health-flows')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getHealthFlowsByIntegration(
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }, { integrationId: 'integrationId' }],
            limit: 50,
        })
        query: any,
    ) {
        return await this.healthFlowService.queryPaginate(query);
    }

    @Put(':integrationId/health-flows/:flowId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async updateFlow(
        @Body() dto: CreateHealthFlowDto,
        @Param('flowId') flowId: string,
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        const timer = userAccessLatency.labels(user.name, 'update_flow', workspaceId).startTimer();
        const result = await this.healthFlowService._update(flowId, {
            ...dto,
            workspaceId,
            updatedAt: moment().valueOf(),
            updatedByUserId: String(user._id),
            integrationId,
        });

        timer();
        return result;
    }

    @Delete(':integrationId/health-flows/:healthFlowId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async deleteHealthFlow(@Param('healthFlowId') healthFlowId: string) {
        return await this.healthFlowService._delete(healthFlowId);
    }
}
