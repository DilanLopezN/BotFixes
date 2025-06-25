import { PredefinedRoles } from '../../../common/utils/utils';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Get, Param, Delete, Put, ValidationPipe, Query } from '@nestjs/common';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AutoAssignConversationService } from '../services/auto-assign-conversation.service';
import { UpdateAutoAssignConversation } from '../interfaces/auto-assign-conversation.interface';
import { AutoAssignConversationFilterInterface } from '../interfaces/auto-assign-conversation-filter.interface';
import { CreateAutoAssignDto } from '../dto/create-auto-assign.dto';
import { UpdateAutoAssignDto } from '../dto/update-auto-assign.dto';

@Controller('workspaces')
@ApiTags('Auto assign Conversation')
export class AutoAssignConversationController {
    constructor(private readonly AutoAssignConversationService: AutoAssignConversationService) {}

    @Post(':workspaceId/auto-assign-conversation')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createAutoAssignConversation(
        @Body(new ValidationPipe()) body: CreateAutoAssignDto,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.AutoAssignConversationService.create({
            ...body,
            workspaceId,
        });
    }

    @Put(':workspaceId/auto-assign-conversations/:autoAssignConversationId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async update(
        @Body(new ValidationPipe()) body: UpdateAutoAssignDto,
        @Param('workspaceId') workspaceId: string,
        @Param('autoAssignConversationId') autoAssignConversationId: number,
    ) {
        return await this.AutoAssignConversationService.update(Number(autoAssignConversationId), workspaceId, body);
    }

    @Get(':workspaceId/auto-assign-conversations/:autoAssignConversationId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getOneAutoAssignConversation(
        @Param('autoAssignConversationId') autoAssignConversationId: number,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.AutoAssignConversationService.getOne(autoAssignConversationId, workspaceId);
    }

    @Get(':workspaceId/auto-assign-conversations')
    @ApiQuery({ name: 'skip', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({
        name: 'filter',
        type: String,
        description: 'filter={"$or":[{"key1":"value1"},{"key2":"value2"}]}',
        required: false,
    })
    @UseGuards(AuthGuard)
    getAllByWorkspaceId(
        @Param('workspaceId') workspaceId: string,
        @Query('limit') limit: string,
        @Query('skip') skip: string,
        @Query('search') search: string,
        @Query('filter') filter: string,
    ) {
        return this.AutoAssignConversationService.listByWorkspaceIdAndQuery(workspaceId, {
            skip: skip ? Number(skip) : undefined,
            limit: limit ? Number(limit) : undefined,
            search: search,
            filter: filter ? (JSON.parse(filter) as AutoAssignConversationFilterInterface) : undefined,
        });
    }

    @Delete(':workspaceId/auto-assign-conversations/:autoAssignConversationId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async delete(
        @Param('workspaceId') workspaceId: string,
        @Param('autoAssignConversationId') autoAssignConversationId: number,
    ) {
        return await this.AutoAssignConversationService.softDelete(workspaceId, autoAssignConversationId);
    }
}
