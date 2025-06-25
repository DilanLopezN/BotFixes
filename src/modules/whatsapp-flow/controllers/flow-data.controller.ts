import { Controller, Param, Get, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { FlowDataService } from '../services/flow-data.service';

@Controller('/channels/whatsapp/flow-data')
@UseGuards(AuthGuard)
export class FlowDataController {
    constructor(private readonly flowDataService: FlowDataService) {}

    @Get('/workspaces/:workspaceId/list')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getFlowDataByWorkspaceId(@Param('workspaceId') workspaceId: string) {
        return await this.flowDataService.getFlowDataByWorkspaceIdAndFlow(workspaceId);
    }

    @Get('/workspaces/:workspaceId/find-one/:flowDataId')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getFlowDataByIdAndFlow(
        @Param('workspaceId') workspaceId: string,
        @Param('flowDataId', ParseIntPipe) flowDataId: number,
    ) {
        return await this.flowDataService.getFlowDataByWorkspaceIdAndId(workspaceId, flowDataId);
    }
}
