import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateActiveMessageSettingDto } from '../dto/create-active-message-setting.dto';
import { UpdateActiveMessageSettingData } from '../interfaces/update-active-message-setting-data.interface';
import { ObjectiveType } from '../models/active-message-setting.entity';
import { ActiveMessageSettingService } from '../services/active-message-setting.service';

@Controller('workspaces')
export class ActiveMessageSettingController {
    constructor(private readonly activeMessageSettingService: ActiveMessageSettingService) {}
    @Get('/:workspaceId/active-message-settings')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listByWorkspaceId(@Param('workspaceId') workspaceId: string, @Query('objective') objective: ObjectiveType) {
        const query = objective ? { objective } : undefined;
        return this.activeMessageSettingService.listByWorkspaceId(workspaceId, query);
    }

    @Get('/:workspaceId/active-message-settings/:activeMessageId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getOne(@Param('activeMessageId') id: string) {
        return this.activeMessageSettingService.getOne(parseInt(id));
    }

    @Post('/:workspaceId/active-message-settings')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createSetting(@Body() body: CreateActiveMessageSettingDto, @Param('workspaceId') workspaceId: string) {
        return this.activeMessageSettingService.createAndUpdateFlags({
            ...body,
            workspaceId,
        });
    }

    @Put('/:workspaceId/active-message-settings')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateSetting(@Body() body: UpdateActiveMessageSettingData) {
        return this.activeMessageSettingService.update({
            ...body,
        });
    }

    @Delete(':workspaceId/active-message-settings/:activeMessageId')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async delete(@Param('activeMessageId') id: string) {
        return await this.activeMessageSettingService.delete(parseInt(id));
    }
}
