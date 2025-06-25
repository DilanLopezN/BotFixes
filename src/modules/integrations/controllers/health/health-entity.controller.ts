import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { HealthEntityService } from '../../services/health/health-entity.service';
import { QueryStringDecorator } from '../../../../decorators/queryString.decorator';
import { UpdateHealthEntityDto } from '../../dto/health/health-entity.dto';
import { HealthEntityType, User } from 'kissbot-core';
import { AuthGuard } from '../../../../modules/auth/guard/auth.guard';
import { UserDecorator } from '../../../../decorators/user.decorator';
import { HealthEntity, IHealthEntity } from '../../interfaces/health/health-entity.interface';
import * as moment from 'moment';
import { RolesDecorator } from '../../../users/decorators/roles.decorator';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { IntegrationEnabledGuard } from '../../guards/integration_enabled.guard';
import { Types } from 'mongoose';
import { DeleteDisabledHealthEntitiesResponse } from '../../interfaces/health/delete-disabled-health-entities-response.interface';
import { ApiTags } from '@nestjs/swagger';

@UseGuards(AuthGuard, RolesGuard)
@ApiTags('Health Entities')
@Controller('workspaces/:workspaceId/integrations/:integrationType')
export class HealthEntityController {
    constructor(private readonly healthEntityService: HealthEntityService) {}

    @Put(':integrationId/health-entities/:entityId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async updateHealthEntity(
        @Body() body: UpdateHealthEntityDto,
        @Param('entityId') entityId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
        @Query('updateSpecialityType') updateSpecialityType: boolean,
    ): Promise<HealthEntity> {
        return await this.healthEntityService.updateEntity(entityId, body, workspaceId, user, !!updateSpecialityType);
    }

    @Put(':integrationId/health-entities/:entityId/draft')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async updateHealthEntityDraft(
        @Body() body: UpdateHealthEntityDto,
        @Param('entityId') entityId: string,
        @Param('workspaceId') workspaceId: string,
    ): Promise<HealthEntity> {
        return await this.healthEntityService.updateReverseChangesEntity(entityId, body, workspaceId);
    }

    @Post(':integrationId/health-entities/update/batch')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async updateHealthEntityBatch(
        @Body() body: HealthEntity[],
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthEntityService.updateEntityBatch(body, workspaceId, user);
    }

    @Post(':integrationId/health-entities/delete/batch')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async deleteHealthEntityBatch(@Body() body: string[]) {
        return await this.healthEntityService.deleteEntityBatch(body);
    }

    @Post(':integrationId/health-entities')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async createHealthEntity(
        @Body() body: IHealthEntity[],
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ): Promise<HealthEntity[]> {
        const entities = body.map((entity) => {
            return {
                ...entity,
                workspaceId: new Types.ObjectId(workspaceId),
                createdBy: user._id,
                createdAt: moment().valueOf(),
            };
        });
        return await this.healthEntityService.createEntity(entities);
    }

    @Delete(':integrationId/health-entities/:entityId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async deleteHealthEntity(
        @Param('entityId') entityId: string,
        @Param('workspaceId') workspaceId: string,
    ): Promise<void> {
        return await this.healthEntityService._delete(entityId, workspaceId);
    }

    @Post(':integrationId/extract/:entityType')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async extractHealthEntity(
        @Param('integrationId') integrationId: string,
        @Param('entityType') entityType: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.healthEntityService.extractHealthEntity(
            entityType as HealthEntityType,
            integrationId,
            workspaceId,
        );
    }

    @Post(':integrationId/entities/extract')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async extractAllHealthEntitities(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @Query('partialEntitiesType') partialEntitiesType: HealthEntityType[],
    ) {
        return await this.healthEntityService.extractAllHealthEntitities(
            integrationId,
            workspaceId,
            partialEntitiesType,
        );
    }

    @Post(':integrationId/entities/synchronize')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async synchronizeAllHealthEntitities(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.healthEntityService.publishAllHealthEntities(integrationId, workspaceId);
    }

    @Post(':integrationId/entities/synchronize/:entityType')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async synchronizeHealthEntititie(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @Param('entityType') entityType: string,
    ) {
        return await this.healthEntityService.publishHealthEntity(
            integrationId,
            workspaceId,
            entityType as HealthEntityType,
        );
    }

    @Get(':integrationId/health-entities')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async getHealthEntitiesByIntegration(
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }, { integrationId: 'integrationId' }],
        })
        query: any,
    ) {
        return await this.healthEntityService.queryPaginate(query);
    }

    @Get(':integrationId/health-entities-to-sync')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(IntegrationEnabledGuard)
    async getHealthEntitiesToSync(
        @Query('entityType') entityType: HealthEntityType,
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.healthEntityService.getHealthEntitiesToSync({
            entityType,
            integrationId,
            workspaceId,
        });
    }

    @Post(':integrationId/health-entities/delete-disabled/:entityType')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(IntegrationEnabledGuard)
    async deleteDisabledHealthEntities(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @Param('entityType') entityType: string,
    ): Promise<DeleteDisabledHealthEntitiesResponse> {
        return await this.healthEntityService.deleteDisabledHealthEntities(
            integrationId,
            workspaceId,
            entityType as HealthEntityType,
        );
    }
}
