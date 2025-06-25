import { Body, Controller, Param, Post, Res, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { ConversationCategorizationService } from '../services/conversation-categorization.service';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateConversationCategorizationParams } from '../interfaces/create-conversation-categorization.interface';
import { UpdateConversationCategorizationParams } from '../interfaces/update-conversation-categorization.interface';
import { DefaultRequest, DefaultResponse } from '../../../common/interfaces/default';
import { ConversationCategorization } from '../models/conversation-categorization.entity';
import {
    DoDeleteConversationCategorizationParams,
    DoDeleteConversationCategorizationResponse,
} from '../interfaces/do-delete-conversation-categorization.interface';
import {
    GetConversationCategorizationParams,
    GetConversationCategorizationResponse,
} from '../interfaces/get-conversation-categorization.interface';
import { downloadFileType, typeDownloadEnum } from '../../../common/utils/downloadFileType';
import { GetConversationCategorizationCSVParams } from '../interfaces/get-conversation-categorization-csv.interface';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Conversation Categorizations')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/conversation-categorizations')
export class ConversationCategorizationController {
    constructor(private readonly conversationCategorizationService: ConversationCategorizationService) {}

    @Post('create-conversation-categorization')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @ApiBody({
        description: 'Create conversation categorization parameters',
        type: DefaultRequest<CreateConversationCategorizationParams>,
    })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createConversationCategorization(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<CreateConversationCategorizationParams>,
    ): Promise<DefaultResponse<ConversationCategorization>> {
        return await this.conversationCategorizationService.createConversationCategorization(workspaceId, body.data);
    }

    @Post('get-conversation-categorizations')
    @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
    @ApiBody({
        description: 'Get conversation categorization parameters',
        type: DefaultRequest<GetConversationCategorizationParams>,
    })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getConversationCategorizations(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<GetConversationCategorizationParams>,
    ): Promise<DefaultResponse<GetConversationCategorizationResponse[]>> {
        return await this.conversationCategorizationService.getConversationCategorizations(workspaceId, body);
    }

    @Post('update-conversation-categorization')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateConversationCategorization(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<UpdateConversationCategorizationParams>,
    ): Promise<DefaultResponse<ConversationCategorization>> {
        return await this.conversationCategorizationService.updateConversationCategorization(workspaceId, body.data);
    }

    @Post('do-delete-conversation-categorization')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async doDeleteConversationCategorization(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<DoDeleteConversationCategorizationParams>,
    ): Promise<DoDeleteConversationCategorizationResponse> {
        return await this.conversationCategorizationService.deleteConversationCategorization(
            workspaceId,
            body.data.conversationCategorizationId,
        );
    }

    @Post('get-csv')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getConversationCategorizationsCsv(
        @Param('workspaceId') workspaceId: string,
        @Body() body: DefaultRequest<GetConversationCategorizationCSVParams>,
        @Res() response,
    ): Promise<void> {
        const result = await this.conversationCategorizationService.getConversationCategorizationsCsv(
            workspaceId,
            body,
        );

        return downloadFileType(
            body.data.downloadType || typeDownloadEnum.XLSX,
            result,
            response,
            'conversation-categorizations',
        );
    }
}
