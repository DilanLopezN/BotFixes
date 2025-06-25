import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { CreateCampaignActionDto, UpdateCampaignActionDto } from '../dto/create-campaign-action.dto';
import { CampaignActionService } from '../../campaign/services/campaign-action.service';
import { CampaignAction } from '../models/campaign-action.entity';

@Controller('workspaces')
export class CampaignActionController {
    constructor(private readonly campaignActionService: CampaignActionService) {}

    @Get('/:workspaceId/campaign-actions')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listByWorkspaceId(@Param('workspaceId') workspaceId: string): Promise<CampaignAction[]> {
        return this.campaignActionService.listByWorkspaceId(workspaceId);
    }

    @Post('/:workspaceId/campaign-actions')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createCampaignAction(@Param('workspaceId') workspaceId: string, @Body() body: CreateCampaignActionDto) {
        return this.campaignActionService.createCampaignAction({
            ...body,
            workspaceId,
        });
    }

    @Put('/:workspaceId/campaign-actions/:campaignActionId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateCampaignAction(
        @Param('workspaceId') workspaceId: string,
        @Param('campaignActionId') campaignActionId: number,
        @Body() body: UpdateCampaignActionDto,
    ) {
        return this.campaignActionService.updateCampaignAction({
            id: Number(campaignActionId),
            name: body.name,
            workspaceId,
        });
    }

    @Delete('/:workspaceId/campaign-actions/:campaignActionId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async deleteCampaignAction(
        @Param('workspaceId') workspaceId: string,
        @Param('campaignActionId') campaignActionId: number,
    ) {
        return this.campaignActionService.deleteCampaignAction(workspaceId, Number(campaignActionId));
    }
}
