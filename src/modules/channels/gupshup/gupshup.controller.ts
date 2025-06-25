import { Controller, Body, Post, Param, Query, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { ReferralService } from './services/referral.service';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';

@Controller('/channels')
@UseGuards(AuthGuard)
export class ChannelGupshupWhatsappController {
    constructor(private readonly referralService: ReferralService) {}

    @Get('/workspaces/:workspaceId/referral-list')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    async listByWorkspaceId(@Param('workspaceId') workspaceId: string) {
        return await this.referralService.referralListByWorkspaceId(workspaceId);
    }
}
