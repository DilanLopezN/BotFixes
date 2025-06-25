import { Controller, Param, Post, Body, Put, Delete, Get, UseGuards } from '@nestjs/common';
import { EntitiesService } from './entities.service';
import { ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { castObjectId, PredefinedRoles } from '../../common/utils/utils';
import { EntityModel } from './schemas/entity.schema';
import { EntitiesDto } from './dtos/entitiesDto.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesDecorator } from './../users/decorators/roles.decorator';
import { RolesGuard } from './../users/guards/roles.guard';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';

@ApiTags('Entities')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(AuthGuard, RolesGuard)
export class EntitiesController {
    constructor(private readonly entitiesService: EntitiesService) {}

    @Post(':workspaceId/entities')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async save(@Param('workspaceId') workspaceId: string, @Body() entityDto: EntitiesDto) {
        const newEntity = new EntityModel();
        Object.assign(newEntity, entityDto);
        newEntity.workspaceId = castObjectId(workspaceId);
        return await this.entitiesService.createEntity(newEntity, workspaceId);
    }

    @Put(':workspaceId/entities/:entityId')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'entityId', description: 'entity id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async update(
        @Param('entityId') entityId: string,
        @Param('workspaceId') workspaceId: string,
        @Body() entityDto: EntitiesDto,
    ) {
        const updateBot = new EntityModel();
        Object.assign(updateBot, entityDto);
        updateBot.workspaceId = castObjectId(workspaceId);
        return await this.entitiesService.updateEntity(entityId, updateBot);
    }

    @Delete(':workspaceId/entities/:entityId')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'entityId', description: 'entity id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async delete(@Param('entityId') entityId: string) {
        return await this.entitiesService.deleteEntity(entityId);
    }

    @Get(':workspaceId/entities/:entityId')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'entityId', description: 'entity id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getOne(@Param('entityId') entityId: string) {
        return await this.entitiesService.getOne(entityId);
    }

    @Get(':workspaceId/entities')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getAll(
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }],
            limit: 30,
        })
        query: QueryStringFilter,
    ) {
        return await this.entitiesService.queryPaginate(query, 'GET_ENTITIES');
    }
}
