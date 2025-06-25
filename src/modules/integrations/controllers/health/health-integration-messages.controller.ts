import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { User } from 'kissbot-core';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { UserDecorator } from '../../../../decorators/user.decorator';
import { RolesDecorator } from '../../../users/decorators/roles.decorator';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { HealthIntegrationMessagesService } from '../../services/health/health-integration-messages.service';
import { CreateIntegrationMessageDto } from '../../dto/health/health-message.dto';
import { IntegrationMessageType } from '../../interfaces/health/health-integration-messages.interface';

@UseGuards(AuthGuard, RolesGuard)
@Controller('workspaces/:workspaceId/integrations')
export class HealthIntegrationMessagesController {
    constructor(private readonly messagesService: HealthIntegrationMessagesService) {}

    @Post(':integrationId/messages')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async createIntegrationMessage(
        @Body() body: CreateIntegrationMessageDto,
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.messagesService.createIntegrationMessage({
            ...body,
            createdAt: +new Date(),
            createdByUserId: user._id,
            integrationId,
            workspaceId,
            type: IntegrationMessageType.user,
        });
    }

    @Delete(':integrationId/messages/:integrationMessageId')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async deleteIntegrationMessage(
        @Param('integrationMessageId') integrationMessageId: string,
        @Param('integrationId') integrationId: string,
    ) {
        return await this.messagesService.deleteIntegrationMessage(integrationId, integrationMessageId);
    }

    @Get(':integrationId/messages')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async listIntegrationMessages(
        @Param('integrationId') integrationId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.messagesService.listIntegrationMessage(workspaceId, integrationId);
    }
}
