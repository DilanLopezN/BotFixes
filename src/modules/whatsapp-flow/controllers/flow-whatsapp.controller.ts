import { Controller, Body, Post, Param, UseGuards, ValidationPipe, Get, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { castObjectIdToString, PredefinedRoles } from '../../../common/utils/utils';
import { FlowService } from '../services/flow.service';
import { ActiveFlowDto, CreateFlowDto, DeactiveFlowDto, PublishFlowDto, UpdateFlowDataDto } from '../dto/flow.dto';
import { UserDecorator } from '../../../decorators/user.decorator';
import { User } from '../../users/interfaces/user.interface';

@Controller('/channels/whatsapp/flow')
@UseGuards(AuthGuard)
export class FlowWhatsappController {
    constructor(private readonly flowService: FlowService) {}

    @Post('/workspaces/:workspaceId/create-flow')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async createFlow(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                transform: true,
            }),
        )
        body: CreateFlowDto,
    ) {
        return await this.flowService.create(workspaceId, body, castObjectIdToString(user._id));
    }

    @Post('/workspaces/:workspaceId/update-flow-data/:flowId')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async updateFlowDataByFlowId(
        @Param('workspaceId') workspaceId: string,
        @Param('flowId', ParseIntPipe) id: number,
        @Body(
            new ValidationPipe({
                transform: true,
            }),
        )
        body: UpdateFlowDataDto,
    ) {
        return await this.flowService.updateFlowDataByFlowId(id, body.flowData);
    }

    @Post('/workspaces/:workspaceId/publish')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async publishFlow(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        body: PublishFlowDto,
    ) {
        return await this.flowService.publishFlow(workspaceId, body.channelConfigId, body.flowId);
    }

    @Get('/workspaces/:workspaceId/list-flows')
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    async listFlows(@Param('workspaceId') workspaceId: string) {
        return await this.flowService.getFlowByWorkspaceId(workspaceId);
    }

    @Post('/workspaces/:workspaceId/deactivate')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async deactivateFlow(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        body: DeactiveFlowDto,
    ) {
        return await this.flowService.deactivateFlow(workspaceId, body.channelConfigId, body.flowId);
    }

    @Post('/workspaces/:workspaceId/activate')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async activateFlow(
        @Param('workspaceId') workspaceId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        body: ActiveFlowDto,
    ) {
        return await this.flowService.activateFlow(workspaceId, body.channelConfigId, body.flowId);
    }
}
