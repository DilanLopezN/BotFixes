import { Body, Controller, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiParam } from '@nestjs/swagger';
import { SuggestionTextsService } from './services/suggestion-texts.service';
import { DefaultRequest, DefaultResponse } from '../../common/interfaces/default';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../common/utils/utils';
import { TemplateMarketingInsightParamsDto } from './dto/template-text-suggestion.dto';
import { AgentSuggestionTextParamsDto } from './dto/agent-text-suggestion.dto';

@Controller('workspaces/:workspaceId/suggestions')
export class SuggestionTextsController {
    constructor(private readonly suggestionTextsService: SuggestionTextsService) {}

    @Post('getAgentMessageSuggestions')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiBody({
        type: DefaultRequest<AgentSuggestionTextParamsDto>,
    })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async getAgentMessageSuggestions(
        @Body(new ValidationPipe()) body: DefaultRequest<AgentSuggestionTextParamsDto>,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<{ suggestions: string[] }>> {
        return await this.suggestionTextsService.getAgentMessageSuggestions(workspaceId, body.data);
    }

    @Post('getTemplateMessageSuggestions')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiBody({
        type: DefaultRequest<AgentSuggestionTextParamsDto>,
    })
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async getTemplateMessageSuggestions(
        @Body(new ValidationPipe()) body: DefaultRequest<AgentSuggestionTextParamsDto>,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<{ suggestions: string[] }>> {
        return await this.suggestionTextsService.getTemplateMessageSuggestions(workspaceId, body.data);
    }

    @Post('getTemplateMessageMarketingInsights')
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiBody({
        type: DefaultRequest<TemplateMarketingInsightParamsDto>,
    })
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    async getTemplateMessageMarketingInsights(
        @Body(new ValidationPipe()) body: DefaultRequest<TemplateMarketingInsightParamsDto>,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<{ insight: string }>> {
        return await this.suggestionTextsService.getTemplateMessageMarketingInsights(workspaceId, body.data);
    }
}
