import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CampaignConfigService } from '../services/campaign-config.service';
import { CreateCampaignConfigDto } from '../dto/create-campaign-config.dto';
import { UpdateCampaignConfigDto } from '../dto/update-campaign-config.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Campaign Config')
@ApiBearerAuth()
@Controller('workspaces')
export class CampaignConfigController {
    constructor(private readonly campaignConfigService: CampaignConfigService) {}

    @Get('/:workspaceId/campaign-configs')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listByWorkspaceId(@Param('workspaceId') workspaceId: string) {
        return this.campaignConfigService.listByWorkspaceId(workspaceId);
    }

    @Get('/:workspaceId/campaign-configs/active')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listActiveByWorkspaceId(@Param('workspaceId') workspaceId: string) {
        return this.campaignConfigService.listActiveByWorkspaceId(workspaceId);
    }

    @Get('/:workspaceId/campaign-configs/:id')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getById(@Param('id') id: string, @Param('workspaceId') workspaceId: string) {
        return this.campaignConfigService.getByIdAndWorkspace(id, workspaceId);
    }

    @Post('/:workspaceId/campaign-configs')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN, PredefinedRoles.WORKSPACE_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async create(@Body() body: CreateCampaignConfigDto, @Param('workspaceId') workspaceId: string) {
        const createData = {
            ...body,
            workspaceId,
        };

        return this.campaignConfigService.create(createData);
    }

    @Put('/:workspaceId/campaign-configs/:id')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN, PredefinedRoles.WORKSPACE_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async update(
        @Param('id') id: string,
        @Param('workspaceId') workspaceId: string,
        @Body() body: UpdateCampaignConfigDto,
    ) {
        return this.campaignConfigService.update(body, id, workspaceId);
    }

    @Delete('/:workspaceId/campaign-configs/:id')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN, PredefinedRoles.WORKSPACE_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async delete(@Param('id') id: string, @Param('workspaceId') workspaceId: string) {
        await this.campaignConfigService.delete(id, workspaceId);
        return { message: 'Campaign configuration deleted successfully' };
    }

    @Get('/:workspaceId/campaign-configs/:id/status')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async checkStatus(@Param('id') id: string, @Param('workspaceId') workspaceId: string) {
        const isActive = await this.campaignConfigService.isCampaignActive(id, workspaceId);
        return { isActive };
    }
}
