import { Controller, Get, Post, Body, Put, Param, ValidationPipe, UseGuards } from '@nestjs/common';
import { QueryStringDecorator } from '../../../../decorators/queryString.decorator';
import { HealthIntegrationService } from '../../services/health/health-integration.service';
import { CreateHealthIntegrationDto, UpdateHealthIntegrationDto } from '../../dto/health/health-integration.dto';
import { RolesGuard } from '../../../../modules/users/guards/roles.guard';
import { AuthGuard } from '../../../../modules/auth/guard/auth.guard';
import { User } from '../../../users/interfaces/user.interface';
import { UserDecorator } from '../../../../decorators/user.decorator';
import { RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { IntegrationEnabledGuard } from '../../guards/integration_enabled.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('workspaces/:workspaceId/integrations/:integrationType')
export class HealthController {
    constructor(private readonly healthIntegrationService: HealthIntegrationService) {}

    @Post('')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async createHealthIntegration(
        @Body(new ValidationPipe()) body: CreateHealthIntegrationDto,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.healthIntegrationService._create({
            ...body,
            workspaceId,
        });
    }

    @Put(':healthIntegrationId')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async updateHealthIntegration(
        @Body(new ValidationPipe()) body: UpdateHealthIntegrationDto,
        @Param('healthIntegrationId') healthIntegrationId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.healthIntegrationService._update(healthIntegrationId, body, workspaceId);
    }

    @Get('')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async getHealthIntegrations(
        @Param('workspaceId') workspaceId: string,
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }],
            limit: 30,
        })
        filters,
        @UserDecorator() user: User,
    ) {
        return await this.healthIntegrationService._getAll(user, filters, workspaceId);
    }

    @Put(':healthIntegrationId/syncStatus')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async updateSyncStatus(
        @Param('healthIntegrationId') healthIntegrationId: string,
        @Param('workspaceId') workspaceId: string,
        @Body() data: any,
    ) {
        return await this.healthIntegrationService.updateSyncStatus(healthIntegrationId, data, workspaceId);
    }

    @Post(':healthIntegrationId/clear-cache')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async clearCache(
        @Param('healthIntegrationId') healthIntegrationId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.healthIntegrationService.clearCache(healthIntegrationId, workspaceId);
    }

    @Post(':healthIntegrationId/syncAllDone')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async syncAllDone(@Param('healthIntegrationId') healthIntegrationId: string) {
        return await this.healthIntegrationService.syncAllDone(healthIntegrationId);
    }

    @Post(':healthIntegrationId/generateAccessToken')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(IntegrationEnabledGuard)
    async generateAccessToken(
        @Param('healthIntegrationId') healthIntegrationId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.healthIntegrationService.generateAccessToken(workspaceId, healthIntegrationId);
    }
}
