import { Body, Controller, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { GeneralBreakSettingService } from '../services/general-break-setting.service';
import { CreateGeneralBreakSettingDto } from '../dto/create-general-break-setting.dto';
import { UpdateGeneralBreakSettingDto } from '../dto/update-general-break-setting.dto';
import { GeneralBreakSetting } from '../models/general-break-setting.entity';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AgentStatusFeatureFlagGuard } from '../guards/agent-status-feature-flag.guard';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { DefaultResponse } from '../../../common/interfaces/default';

@ApiTags('General break settings')
@ApiBearerAuth()
@Controller('/workspaces/:workspaceId/agentStatus')
@UseGuards(AuthGuard, AgentStatusFeatureFlagGuard)
export class GeneralBreakSettingController {
    constructor(private readonly generalBreakSettingService: GeneralBreakSettingService) {}

    @Post('/createGeneralBreakSetting')
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
        createDto: CreateGeneralBreakSettingDto,
    ): Promise<DefaultResponse<GeneralBreakSetting>> {
        const result = await this.generalBreakSettingService.create({ ...createDto, workspaceId });

        return { data: result };
    }

    @Post('/updateGeneralBreakSetting')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
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
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        updateDto: UpdateGeneralBreakSettingDto,
    ): Promise<DefaultResponse<GeneralBreakSetting>> {
        const result = await this.generalBreakSettingService.update(workspaceId, updateDto);

        return { data: result };
    }

    @Post('getGeneralBreakSetting')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async findOne(@Param('workspaceId') workspaceId: string): Promise<DefaultResponse<GeneralBreakSetting>> {
        const result = await this.generalBreakSettingService.findByWorkspaceId(workspaceId);

        return { data: result };
    }
}
