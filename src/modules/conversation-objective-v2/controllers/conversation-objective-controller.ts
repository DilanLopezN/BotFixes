import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { ConversationObjectiveService } from '../services/conversation-objective.service';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateConversationObjectiveParams } from '../interfaces/create-conversation-objective.interface';
import { UpdateConversationObjectiveParams } from '../interfaces/update-conversation-objective.interface';
import { DefaultRequest, DefaultResponse } from '../../../common/interfaces/default';
import { ConversationObjective } from '../models/conversation-objective.entity';
import {
    DoDeleteConversationObjectivesParams,
    DoDeleteConversationObjectivesResponse,
} from '../interfaces/do-delete-conversation-objective.interface';
import { GetConversationObjectiveParams } from '../interfaces/get-conversation-objective.interface';

@Controller('workspaces/:workspaceId/conversation-objectives')
export class ConversationObjectiveController {
    constructor(private readonly conversationObjectiveService: ConversationObjectiveService) {}

    @Post('create-conversation-objective')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createConversationObjective(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<CreateConversationObjectiveParams>,
    ): Promise<DefaultResponse<ConversationObjective>> {
        return await this.conversationObjectiveService.createConversationObjective(workspaceId, body.data);
    }

    @Post('get-conversation-objectives')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getConversationObjectives(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<GetConversationObjectiveParams>,
    ): Promise<DefaultResponse<ConversationObjective[]>> {
        return await this.conversationObjectiveService.getConversationObjectives(workspaceId, body.data);
    }

    @Post('update-conversation-objective')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateConversationObjective(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<UpdateConversationObjectiveParams>,
    ): Promise<DefaultResponse<ConversationObjective>> {
        return await this.conversationObjectiveService.updateConversationObjective(workspaceId, body.data);
    }

    @Post('do-delete-conversation-objectives')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async doDeleteConversationObjectives(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<DoDeleteConversationObjectivesParams>,
    ): Promise<DoDeleteConversationObjectivesResponse> {
        return await this.conversationObjectiveService.deleteConversationObjectives(
            workspaceId,
            body.data.conversationObjectiveIds,
        );
    }

    @Post(':conversationObjectiveId/restore')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async restoreConversationObjective(
        @Param('workspaceId') workspaceId: string,
        @Param('conversationObjectiveId', ParseIntPipe) conversationObjectiveId: number,
    ): Promise<{ ok: boolean }> {
        return await this.conversationObjectiveService.restoreConversationObjective(
            workspaceId,
            conversationObjectiveId,
        );
    }
}
