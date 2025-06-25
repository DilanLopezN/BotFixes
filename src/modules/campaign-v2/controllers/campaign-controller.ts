import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { CampaignFeatureFlagGuard } from '../../active-message/guards/campaign-feature-flag.guard';
import { CampaignService } from '../services/campaign.service';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateCampaignParams, CreateCampaignResponse } from '../interfaces/create-campaign.interface';
import { UpdateCampaignParams, UpdateCampaignResponse } from '../interfaces/update-campaign.interface';
import { DefaultRequest, DefaultResponse } from '../../../common/interfaces/default';
import { Campaign } from '../../campaign/models/campaign.entity';
import { DoDeleteCampaignParams, DoDeleteCampaignResponse } from '../interfaces/do-delete-campaign.interface';
import { ListCampaignParams } from '../interfaces/list-campaign.interface';
import { GetCampaignParams, GetCampaignResponse } from '../interfaces/get-campaign.interface';
import { CampaignContactService } from '../services/campaign-contact.service';
import { CloneCampaignParams } from '../interfaces/clone-campaign.interface';

@Controller('workspaces/:workspaceId/campaigns')
export class CampaignController {
    constructor(
        private readonly campaignService: CampaignService,
        private readonly campaignContactService: CampaignContactService,
    ) {}

    @Post('create-campaign')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async createCampaign(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<CreateCampaignParams>,
    ): Promise<DefaultResponse<CreateCampaignResponse>> {
        return await this.campaignService.createCampaign(workspaceId, body.data);
    }

    @Post('clone-campaign')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async cloneCampaign(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<CloneCampaignParams>,
    ): Promise<DefaultResponse<Partial<Campaign>>> {
        return await this.campaignService.cloneCampaign(workspaceId, body.data);
    }

    @Post('list-campaigns')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async getCampaigns(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<ListCampaignParams>,
    ): Promise<DefaultResponse<Campaign[]>> {
        return await this.campaignService.getCampaignByWorkspace(workspaceId, body);
    }

    @Post('get-campaign')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async getCampaign(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<GetCampaignParams>,
    ): Promise<DefaultResponse<GetCampaignResponse>> {
        return await this.campaignService.getCampaignById(workspaceId, body.data.campaignId);
    }

    @Post('update-campaign')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async updateCampaign(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<UpdateCampaignParams>,
    ): Promise<UpdateCampaignResponse> {
        return await this.campaignService.updateCampaign(workspaceId, body.data);
    }

    @Post('do-delete-campaign')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async doDeleteCampaign(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<DoDeleteCampaignParams>,
    ): Promise<DoDeleteCampaignResponse> {
        return await this.campaignService.deleteCampaign(workspaceId, body.data.campaignId);
    }

    @Post(':campaignId/start')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async startCampaign(@Param('campaignId') campaignId: number) {
        return await this.campaignService.startCampaign(campaignId);
    }

    @Post(':campaignId/contacts')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getContacts(@Param('campaignId') campaignId: number, @Body() body: DefaultRequest<unknown>) {
        return await this.campaignContactService.getCampaignContacts(campaignId, body);
    }
}
