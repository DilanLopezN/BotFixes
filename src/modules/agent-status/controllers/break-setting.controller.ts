import { Body, Controller, Param, ParseIntPipe, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { BreakSettingService } from '../services/break-setting.service';
import { CreateBreakSettingDto } from '../dto/create-break-setting.dto';
import { UpdateBreakSettingDto } from '../dto/update-break-setting.dto';
import { EnableDisableBreakSettingBulkDto } from '../dto/enable-disable-break-setting-bulk.dto';
import { BreakSetting } from '../models/break-setting.entity';
import { DefaultResponse } from '../../../common/interfaces/default';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AgentStatusFeatureFlagGuard } from '../guards/agent-status-feature-flag.guard';
import { FilterBreakSettingDto } from '../dto/find-all-break-setting-filter.dto';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Break settings')
@ApiBearerAuth()
@Controller('/workspaces/:workspaceId/agentStatus')
@UseGuards(AuthGuard, AgentStatusFeatureFlagGuard)
export class BreakSettingController {
    constructor(private readonly breakSettingService: BreakSettingService) {}

    @Post('/createBreakSetting')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async create(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        createDto: CreateBreakSettingDto,
    ): Promise<DefaultResponse<BreakSetting>> {
        const result = await this.breakSettingService.create({ ...createDto, workspaceId });

        return { data: result };
    }

    @Post('/breakSetting/:breakSettingId/updateBreakSetting')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @ApiParam({ name: 'breakSettingId', description: 'Break setting ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async update(
        @Param('workspaceId') workspaceId: string,
        @Param('breakSettingId', ParseIntPipe) breakSettingId: number,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        updateDto: UpdateBreakSettingDto,
    ): Promise<DefaultResponse<BreakSetting>> {
        const result = await this.breakSettingService.update(breakSettingId, workspaceId, updateDto);

        return { data: result };
    }

    @Post('/breakSetting/:breakSettingId/enableBreakSetting')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @ApiParam({ name: 'breakSettingId', description: 'Break setting ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async enable(
        @Param('workspaceId') workspaceId: string,
        @Param('breakSettingId', ParseIntPipe) breakSettingId: number,
    ): Promise<DefaultResponse<BreakSetting>> {
        const result = await this.breakSettingService.enableDisable(breakSettingId, workspaceId, true);

        return { data: result };
    }

    @Post('/breakSetting/:breakSettingId/disableBreakSetting')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @ApiParam({ name: 'breakSettingId', description: 'Break setting ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async disable(
        @Param('workspaceId') workspaceId: string,
        @Param('breakSettingId', ParseIntPipe) breakSettingId: number,
    ): Promise<DefaultResponse<BreakSetting>> {
        const result = await this.breakSettingService.enableDisable(breakSettingId, workspaceId, false);

        return { data: result };
    }

    @Post('/breakSettingBulkEnableDisable')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async bulkEnableDisable(
        @Param('workspaceId') workspaceId: string,
        @Body() bulkDto: EnableDisableBreakSettingBulkDto,
    ): Promise<DefaultResponse<{ success: boolean }>> {
        const result = await this.breakSettingService.enableDisableBulk({ ...bulkDto, workspaceId });

        return { data: result };
    }

    @Post('breakSettingFindAll')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async findAll(
        @Param('workspaceId') workspaceId: string,
        @Body() { enabled, name }: FilterBreakSettingDto,
    ): Promise<DefaultResponse<BreakSetting[]>> {
        return await this.breakSettingService.findAll({
            workspaceId,
            name,
            enabled,
        });
    }

    @Post('/breakSetting/:breakSettingId/findOne')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @ApiParam({ name: 'breakSettingId', description: 'Break setting ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async findOne(
        @Param('workspaceId') workspaceId: string,
        @Param('breakSettingId', ParseIntPipe) breakSettingId: number,
    ): Promise<DefaultResponse<BreakSetting>> {
        return await this.breakSettingService.findByIdAndWorkspaceId(workspaceId, breakSettingId);
    }
}
