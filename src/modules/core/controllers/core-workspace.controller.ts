import { Body, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Controller, Query } from '@nestjs/common';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { RolesGuard } from './../../users/guards/roles.guard';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';
import { CoreWorkspaceService } from '../services/core-workspace.service';
import { ApiQuery } from '@nestjs/swagger';
import { CoreFilterInterface } from '../interfaces/core-filter.interface';
import { CreateCoreWorkspaceData, UpdateCoreWorkspaceData } from '../models/core-workspace.entity';

@Controller('/admin/core-workspaces')
export class CoreWorkspaceController {
    constructor(private readonly coreWorkspaceService: CoreWorkspaceService) {}

    @Post('create-core-workspace')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async create(@Body() body: CreateCoreWorkspaceData) {
        return await this.coreWorkspaceService.create(body);
    }

    @Post('update-core-workspace')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async update(@Body() body: UpdateCoreWorkspaceData) {
        return await this.coreWorkspaceService.update(body);
    }

    @Get('list')
    @ApiQuery({ name: 'skip', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'filter', required: false })
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async list(@Query('limit') limit: string, @Query('skip') skip: string, @Query('filter') filter: string) {
        return await this.coreWorkspaceService.list({
            skip: Number(skip || 0),
            limit: Number(limit || 4),
            filter: filter ? (JSON.parse(filter) as CoreFilterInterface) : undefined,
        });
    }

    @Get('core/:coreId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async getCoreById(@Param('coreId') coreId: string) {
        return await this.coreWorkspaceService.getCoreById(coreId);
    }

    @Get('table-info')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async tableInfo() {
        return await this.coreWorkspaceService.getTableInfo();
    }

    @Get('unused-workspaces')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async getUnusedWorkspaces() {
        return await this.coreWorkspaceService.getUnusedWorkspaces();
    }
}
