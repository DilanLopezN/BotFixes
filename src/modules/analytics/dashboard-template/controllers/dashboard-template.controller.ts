import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { UserDecorator } from "./../../../../decorators/user.decorator";
import { castObjectIdToString, PredefinedRoles } from "../../../../common/utils/utils";
import { AuthGuard } from "../../../auth/guard/auth.guard";
import { RolesDecorator } from "../../../users/decorators/roles.decorator";
import { RolesGuard } from "../../../users/guards/roles.guard";
import { CreateConversationTemplateBatchDto } from "../dto/create-conversation-template-batch.dto";
import { CreateConversationTemplateDto } from "../dto/create-conversation-template.dto";
import { ConversationTemplateService } from "../services/conversation-template.service";
import { User } from "../../../../modules/users/interfaces/user.interface";

@Controller('dashboard-template')
@UseGuards(AuthGuard)
export class DashboardTemplateController {
    
    constructor(
        private readonly conversationTemplateService: ConversationTemplateService,
    ){}

    @Post('workspaces/:workspaceId/conversation-template/batch')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    async createBatch(
        @Body() body: CreateConversationTemplateBatchDto,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ){
        await body.templates.map(template => {
            return this.conversationTemplateService.update(
                { ...template, workspaceId },
                castObjectIdToString(template._id),
                user,
            );
        })
    }

    @Post('workspaces/:workspaceId/conversation-template')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    async create(
        @Body() body: CreateConversationTemplateDto,
        @Param('workspaceId') workspaceId: string,
    ){
        return await this.conversationTemplateService.create({
            ...body,
            workspaceId,
        })
    }

    @Get('workspaces/:workspaceId/conversation-template')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    async listByWorkspaceId(
        @Param('workspaceId') workspaceId: string,
        @Query('groupId') groupId: string,
        @UserDecorator() user: User,
    ){
        return await this.conversationTemplateService.listByWorkspaceId(workspaceId, groupId, user);
    }

    @Put('workspaces/:workspaceId/conversation-template/:templateId')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    async updateConversationTemplate(
        @Body() conversationTemplate: CreateConversationTemplateDto,
        @Param('templateId') templateId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.conversationTemplateService.update({...conversationTemplate, workspaceId}, templateId, user);
    }

    @Delete('workspaces/:workspaceId/conversation-template/:templateId')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    async deleteConversationTemplate(
        @Param('templateId') templateId: string,
    ){
        return await this.conversationTemplateService.deleteConversationTemplate(templateId);
    }
}