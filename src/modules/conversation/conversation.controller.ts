import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { AuthGuard } from './../auth/guard/auth.guard';
import {
    Controller,
    Get,
    UseGuards,
    Param,
    Post,
    Body,
    Put,
    ValidationPipe,
    Delete,
    Query,
    HttpCode,
    Logger,
} from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { ApiQuery, ApiParam, ApiTags, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RolesGuard } from './../../modules/users/guards/roles.guard';
import { RolesDecorator } from './../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../common/utils/utils';
import { ViewedDto, ConversationDtoResponse, ConversationTag } from './dto/conversation.dto';
import { UserDecorator } from './../../decorators/user.decorator';
import { User } from './../users/interfaces/user.interface';
import { ChannelCallbackConversationStart, ChannelConversationStart } from './dto/channelConversation.dto';
import { AssumeConversationDto } from './dto/assume-conversation.dto';
import { ConversationTabFilter } from 'kissbot-core';
import { ActivityDto } from './dto/activities.dto';
import { CloseConversationDto } from './dto/close-conversation.dto';
import { SuspendConversationDto } from './dto/suspend-conversation.dto';
import { TransferConversationDto, TransferConversationToAgentDto } from './dto/transfer-conversation-dto';
import { IpGuard } from '../workspace-access-group/guard/ip.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ConversationSearchDto, ConversationSearchQueryDto } from './dto/conversation-search.dto';
import { SendFileTemplateDto } from './dto/send-file-template.dto';
import { CreateMultipleConversation } from './dto/create-multiple-conversation';
import { CloseConversationWithCategorizationDto } from './dto/close-conversation-with-categorization.dto';
import { AuthApiGuard } from '../auth/guard/auth-api.guard';
import { CreateSmtReDto } from './dto/create-smt-re.dto';

@ApiTags('conversation')
@Controller('workspaces')
@ApiBearerAuth()
export class ConversationController {
    private readonly logger = new Logger(ConversationController.name);
    constructor(private conversationService: ConversationService) {}

    @Get(':workspaceId/conversations')
    @UseGuards(IpGuard, AuthGuard, RolesGuard)
    @ApiQuery({
        name: 'filter',
        type: String,
        description: 'filter={"$or":[{"key1":"value1"},{"key2":"value2"}]}',
        required: false,
    })
    @ApiQuery({ name: 'skip', type: String, description: 'skip=5', required: false })
    @ApiQuery({ name: 'projection', type: String, description: 'fields=id,url', required: false })
    @ApiQuery({ name: 'sort', type: String, description: 'sort=-points,createdAt', required: false })
    @ApiQuery({ name: 'populate', type: String, description: 'populate=a,b&fields=foo,bar,a.baz', required: false })
    @ApiQuery({ name: 'limit', type: String, description: 'limit=10', required: false })
    @ApiQuery({ name: 'resumeType', type: String, description: "'team-resume' | 'user-resume'", required: false })
    @ApiQuery({ name: 'teamId', type: String, description: '', required: false })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    getQuery(
        @QueryStringDecorator({
            filters: [],
            limit: 30,
        })
        query: any,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Query('resumeType') resumeType: string,
        @Query('teamId') teamId: string,
    ) {
        if (resumeType) {
            return this.conversationService.getConversationsResume(workspaceId, resumeType as any, teamId);
        }
        return this.conversationService._queryPaginate(query, user, workspaceId);
    }

    @HttpCode(200)
    @Post(':workspaceId/conversations/search')
    @UseGuards(IpGuard, AuthGuard, RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    getConversationsSearch(
        @Query(new ValidationPipe()) query: ConversationSearchQueryDto,
        @Body(new ValidationPipe()) filters: ConversationSearchDto,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        const term = String(query.term)
            ?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .toLowerCase();
        return this.conversationService.searchConversations(term, workspaceId, query.limit, query.skip, filters, user);
    }

    @Get(':workspaceId/conversations/unread')
    @UseGuards(AuthGuard)
    unreadMessages(@UserDecorator() user: User, @Param('workspaceId') workspaceId: string) {
        return this.conversationService.unreadMessages(workspaceId, user);
    }

    @Get(':workspaceId/conversations/tab/:tab')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    getTabCount(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('tab') tab: ConversationTabFilter,
        @QueryStringDecorator({
            filters: [],
            limit: 1000,
        })
        query: any,
    ) {
        return this.conversationService.getTabCount(workspaceId, user, tab, query);
    }

    @Get(':workspaceId/conversations/queries')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    getTabQuerys(@UserDecorator() user: User, @Param('workspaceId') workspaceId: string) {
        return this.conversationService.getTabFilters(user, workspaceId, true);
    }

    @Get(':workspaceId/conversations/:conversation')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversation', description: 'conversation id', type: String, required: true })
    @ApiResponse({ isArray: false, type: ConversationDtoResponse, status: 200 })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    getConversationById(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('conversation') conversation: string,
    ) {
        return this.conversationService.getConversationWithActivities(user, workspaceId, conversation);
    }

    @Post(':workspaceId/conversations/:conversationId/assume/:userId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @ApiParam({ name: 'userId', description: 'user id', type: String, required: true })
    async assumeConversation(
        @Param('conversationId') conversationId: string,
        @Param('workspaceId') workspaceId: string,
        @Param('userId') userId: string,
        @Body(new ValidationPipe({ transform: true })) body: AssumeConversationDto,
    ): Promise<any> {
        return await this.conversationService.assumeConversation(body, conversationId, userId, workspaceId);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(12, 1)
    @Post(':workspaceId/conversations/:conversationId/activities')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'conversationId', description: 'agent conversation id', type: String, required: true })
    async newActivity(
        @Param('workspaceId') workspaceId: string,
        @Param('conversationId') conversationId: string,
        @Body(new ValidationPipe()) body: ActivityDto,
    ): Promise<any> {
        return await this.conversationService.newActivity(workspaceId, conversationId, body);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(12, 1)
    @Post(':workspaceId/conversations/:conversationId/activities/reaction')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'conversationId', description: 'agent conversation id', type: String, required: true })
    async newActivityReaction(
        @Param('workspaceId') workspaceId: string,
        @Param('conversationId') conversationId: string,
        @Body(new ValidationPipe()) body: ActivityDto,
    ): Promise<any> {
        return await this.conversationService.newActivityReaction(workspaceId, conversationId, body);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(12, 1)
    @Post(':workspaceId/conversations/:conversationId/send-file-template')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async sendFileTemplate(
        @Param('workspaceId') workspaceId: string,
        @Param('conversationId') conversationId: string,
        @Body(new ValidationPipe()) body: SendFileTemplateDto,
    ): Promise<any> {
        return await this.conversationService.sendTemplateFile({
            conversationId,
            workspaceId,
            memberId: body.memberId,
            templateId: body.templateId,
            attributes: body.attributes,
            message: body.message,
        });
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(12, 1)
    @Post(':workspaceId/close-conversations')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async closeConversations(@Param('workspaceId') workspaceId: string): Promise<any> {
        return await this.conversationService.closeAssignedConversations(workspaceId);
    }

    @Put(':workspaceId/conversations/:conversationId/members/:memberId/unsubscribe')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @ApiParam({ name: 'memberId', description: 'member id', type: String, required: true })
    async unsubscribeFromConversation(
        @Param('workspaceId') workspaceId: string,
        @Param('conversationId') conversationId: string,
        @Param('memberId') memberId: string,
    ): Promise<void> {
        return await this.conversationService.unsubscribeFromConversation(workspaceId, conversationId, memberId);
    }

    @Put(':workspaceId/conversations/:conversationId/members/:memberId/unsubscribeByAdmin')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @ApiParam({ name: 'memberId', description: 'member id', type: String, required: true })
    async unsubscribeByAdminFromConversation(
        @Param('workspaceId') workspaceId: string,
        @Param('conversationId') conversationId: string,
        @Param('memberId') memberId: string,
        @UserDecorator() user: User,
    ): Promise<void> {
        return await this.conversationService.unsubscribeByAdminFromConversation(
            workspaceId,
            conversationId,
            memberId,
            user,
        );
    }

    @Put(':workspaceId/conversations/:conversationId/members/:memberId/close-categorization')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'memberId', description: 'member id', type: String, required: true })
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    closeConversationWithCategorization(
        @Param('workspaceId') workspaceId: string,
        @Param('memberId') memberId: string,
        @Param('conversationId') conversationId: string,
        @Body(new ValidationPipe()) data: CloseConversationWithCategorizationDto,
    ): Promise<void> {
        return this.conversationService.closeConversationWithCategorization(
            workspaceId,
            conversationId,
            memberId,
            data,
        );
    }

    @Put(':workspaceId/conversations/:conversationId/members/:memberId/close')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversation', description: 'conversation id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    closeConversation(
        @Param('workspaceId') workspaceId: string,
        @Param('memberId') memberId: string,
        @Param('conversationId') conversationId: string,
        @Body(new ValidationPipe()) closeConversationDto: CloseConversationDto,
    ): Promise<boolean> {
        return this.conversationService.closeConversation(workspaceId, conversationId, memberId, closeConversationDto);
    }

    @Put(':workspaceId/conversations/:conversationId/members/:memberId/suspend')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversation', description: 'conversation id', type: String, required: true })
    @UseGuards(AuthGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    suspendConversation(
        @Param('memberId') memberId: string,
        @Param('conversationId') conversationId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) suspendConversationDto: SuspendConversationDto,
    ): Promise<void> {
        return this.conversationService.suspendConversation(
            workspaceId,
            conversationId,
            memberId,
            suspendConversationDto,
        );
    }

    @HttpCode(200)
    @Post(':workspaceId/conversations/:conversationId/members/:memberId/view')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversation', description: 'conversation id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    viewConversation(
        @Param('memberId') memberId: string,
        @Param('conversationId') conversationId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) viewedDto: ViewedDto,
    ): Promise<void> {
        return this.conversationService.viewConversation(workspaceId, conversationId, memberId, viewedDto);
    }

    @HttpCode(200)
    @Post(':workspaceId/conversations/:conversationId/tags')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversation', description: 'conversation id', type: String, required: true })
    @ApiResponse({ type: ConversationTag, isArray: false, status: 200 })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    createTag(
        @Param('conversationId') conversationId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) tagsDto: any,
    ): Promise<void> {
        return this.conversationService.createTag(workspaceId, conversationId, tagsDto);
    }

    @Delete(':workspaceId/conversations/:conversationId/tags/:tagId')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'conversation', description: 'conversation id', type: String, required: true })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    deleteTag(
        @Param('workspaceId') workspaceId: string,
        @Param('tagId') tagId: string,
        @Param('conversationId') conversationId: string,
    ): Promise<void> {
        return this.conversationService.deleteTag(workspaceId, conversationId, tagId);
    }

    @Post(':workspaceId/channel-configs/:channelConfigId/conversation')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiBody({ type: ChannelConversationStart })
    @RolesDecorator([PredefinedRoles.WORKSPACE_AGENT, PredefinedRoles.WORKSPACE_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async create(
        @UserDecorator() user: User,
        @Body(new ValidationPipe({ transform: true })) liveAgentConversation: ChannelConversationStart,
    ): Promise<any> {
        return await this.conversationService.createChannelConversation(liveAgentConversation, user);
    }

    @Post(':workspaceId/channel-configs/:channelConfigId/send')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiBody({ type: ChannelCallbackConversationStart })
    async createCallback(
        @Body() body: ChannelCallbackConversationStart,
        @Param('workspaceId') workspaceId: any,
        @Param('channelConfigId') channelConfigId: any,
    ) {
        return await this.conversationService.createConversationCallbackValidation(workspaceId, channelConfigId, body);
    }

    @Post(':workspaceId/check-phone/:phone')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'phone', type: String, required: true })
    async startConversationByPhone(
        @Param('workspaceId') workspaceId: any,
        @Param('phone') phone: string,
        @UserDecorator() user: User,
    ) {
        return await this.conversationService.validateWhatsappByPhone(workspaceId, phone, '55', user);
    }

    @Post(':workspaceId/check-phone-number')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'phone', type: String, required: true })
    async validateWhatsappByPhone(
        @Param('workspaceId') workspaceId: any,
        @Body(new ValidationPipe({ transform: true })) data: { phone: string; ddi: string; contactId?: string },
        @UserDecorator() user: User,
    ) {
        return await this.conversationService.validateWhatsappByPhone(
            workspaceId,
            data.phone,
            data.ddi,
            user,
            data.contactId,
        );
    }

    @HttpCode(200)
    @Post(':workspaceId/conversations/:conversationId/members/:memberId/transfer/:teamId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @ApiParam({ name: 'memberId', description: 'member id', type: String, required: true })
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'teamId', description: 'team id to transfer', type: String, required: true })
    async transferConversation(
        @Param('conversationId') conversationId: string,
        @Param('memberId') memberId: string,
        @Param('teamId') teamId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) transferDto: TransferConversationDto,
    ): Promise<void> {
        const { leaveConversation } = transferDto;
        return await this.conversationService.transferConversation(
            conversationId,
            memberId,
            teamId,
            workspaceId,
            leaveConversation,
            false,
        );
    }

    @HttpCode(200)
    @Post(':workspaceId/conversations/close-workspace-conversations')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async closeWorkspaceConversations(
        @Param('workspaceId') workspaceId: string,
        @Query('createdByChannel') createdByChannel?: string,
    ): Promise<void> {
        return await this.conversationService.closeWorkspaceConversations(workspaceId, createdByChannel);
    }

    @Get(':workspaceId/conversation-history/:contactId')
    @UseGuards(IpGuard, AuthGuard, RolesGuard)
    @ApiQuery({ name: 'skip', type: String, description: 'skip=5', required: false })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    getConversationHistoryByContactId(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('contactId') contactId: string,
        @Query('skip') skip: number,
    ) {
        return this.conversationService.getConversationHistoryByContactId(user, workspaceId, contactId, skip || 0);
    }

    @Post(':workspaceId/create-multiple-conversation')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiBody({ type: CreateMultipleConversation })
    @RolesDecorator([PredefinedRoles.WORKSPACE_AGENT, PredefinedRoles.WORKSPACE_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async createMultipleConversations(
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
        @Body(new ValidationPipe({ transform: true })) body: CreateMultipleConversation,
    ) {
        return await this.conversationService.createMultipleConversation(workspaceId, body, user);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(12, 1)
    @Post(':workspaceId/close-emulator-conversations')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthApiGuard, RolesGuard)
    async closeEmulatorConversations(@Param('workspaceId') workspaceId: string): Promise<any> {
        return await this.conversationService.closeEmulatorConversations(workspaceId);
    }

    @HttpCode(200)
    @Post(':workspaceId/conversations/:conversationId/transfer-to-agent')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        // PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async transferConversationToAgent(
        @Param('conversationId') conversationId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) transferDto: TransferConversationToAgentDto,
        @UserDecorator() user: User,
    ): Promise<{ success: boolean }> {
        const { teamId, agentId } = transferDto;
        return await this.conversationService.transferConversationToAgent(
            conversationId,
            agentId,
            workspaceId,
            teamId,
            user,
        );
    }

    @HttpCode(200)
    @Post(':workspaceId/conversations/:conversationId/smart-reengagement')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async createSmtRe(
        @Param('conversationId') conversationId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) createSmtReDto: CreateSmtReDto,
    ): Promise<{ success: boolean }> {
        return await this.conversationService.createSmtRe(conversationId, workspaceId, createSmtReDto.smtReSettingId);
    }

    @HttpCode(200)
    @Delete(':workspaceId/conversations/:conversationId/smart-reengagement')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'conversationId', description: 'conversation id', type: String, required: true })
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    async stopSmtRe(
        @Param('conversationId') conversationId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ): Promise<{ success: boolean }> {
        return await this.conversationService.stopSmtRe(conversationId, workspaceId, user._id as string);
    }
}
