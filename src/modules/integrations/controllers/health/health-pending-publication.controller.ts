import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { User } from '../../../users/interfaces/user.interface';
import { UserDecorator } from '../../../../decorators/user.decorator';
import { HealthFlowService } from '../../services/health/health-flow.service';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';

@UseGuards(AuthGuard, RolesGuard)
@Controller('workspaces/:workspaceId/integrations/general')
export class HealthPedingPublicationController {
    constructor(private readonly healthFlowService: HealthFlowService) {}

    @Get('/pending-publication')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async pendingPublicationsOnIntegrations(@Param('workspaceId') workspaceId: string, @UserDecorator() user: User) {
        return await this.healthFlowService.pendingPublicationsOnIntegrations(workspaceId, user);
    }

    @Get(':integrationId/pending-publication-flow')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async pendingPublicationsFlowOnIntegration(
        @Param('workspaceId') workspaceId: string,
        @Param('integrationId') integrationId: string,
    ) {
        return await this.healthFlowService.pendingPublicationsFlowOnIntegration(workspaceId, integrationId);
    }
}
