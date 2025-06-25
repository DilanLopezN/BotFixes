import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { ConversationOutcomeService } from '../services/conversation-outcome.service';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateConversationOutcomeParams } from '../interfaces/create-conversation-outcome.interface';
import { UpdateConversationOutcomeParams } from '../interfaces/update-conversation-outcome.interface';
import { DefaultRequest, DefaultResponse } from '../../../common/interfaces/default';
import { ConversationOutcome } from '../models/conversation-outcome.entity';
import {
    DoDeleteConversationOutcomesParams,
    DoDeleteConversationOutcomesResponse,
} from '../interfaces/do-delete-conversation-outcome.interface';
import { GetConversationOutcomeParams } from '../interfaces/get-conversation-outcome.interface';

@Controller('workspaces/:workspaceId/conversation-outcomes')
export class ConversationOutcomeController {
    constructor(private readonly conversationOutcomeService: ConversationOutcomeService) {}

    @Post('create-conversation-outcome')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createConversationOutcome(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<CreateConversationOutcomeParams>,
    ): Promise<DefaultResponse<ConversationOutcome>> {
        return await this.conversationOutcomeService.createConversationOutcome(workspaceId, body.data);
    }

    @Post('get-conversation-outcomes')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getConversationOutcomes(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<GetConversationOutcomeParams>,
    ): Promise<DefaultResponse<ConversationOutcome[]>> {
        return await this.conversationOutcomeService.getConversationOutcomes(workspaceId, body.data);
    }

    @Post('update-conversation-outcome')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateConversationOutcome(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<UpdateConversationOutcomeParams>,
    ): Promise<DefaultResponse<ConversationOutcome>> {
        return await this.conversationOutcomeService.updateConversationOutcome(workspaceId, body.data);
    }

    @Post('do-delete-conversation-outcomes')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async doDeleteConversationOutcomes(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<DoDeleteConversationOutcomesParams>,
    ): Promise<DoDeleteConversationOutcomesResponse> {
        return await this.conversationOutcomeService.deleteConversationOutcomes(
            workspaceId,
            body.data.conversationOutcomeIds,
        );
    }

    @Post(':conversationOutcomeId/restore')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async restoreConversationOutcome(
        @Param('workspaceId') workspaceId: string,
        @Param('conversationOutcomeId', ParseIntPipe) conversationOutcomeId: number,
    ): Promise<{ ok: boolean }> {
        return await this.conversationOutcomeService.restoreConversationOutcome(workspaceId, conversationOutcomeId);
    }
}
