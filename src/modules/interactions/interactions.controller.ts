import { Controller, Param, Post, Body, Put, Delete, Get, UseGuards } from '@nestjs/common';
import { InteractionsService } from './services/interactions.service';
import { ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { InteractionModel } from './schemas/interaction.schema';
import { InteractionDto, CommentDto } from './dtos/interactionDto.dto';
import { castObjectId, castObjectIdToString, PredefinedRoles } from '../../common/utils/utils';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { User } from '../users/interfaces/user.interface';
import { RolesGuard } from '../users/guards/roles.guard';
import { UserDecorator } from '../../decorators/user.decorator';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { userAccessLatency } from '../../common/utils/prom-metrics';

@ApiTags('Interactions')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(AuthGuard)
export class InteractionsController {
    constructor(private readonly interactionService: InteractionsService) {}

    @Put(':workspaceId/bots/:botId/interactions/errors')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    public async getPublishErrors(
        @Param('botId') botId: string,
        @Param('workspaceId') workspaceId: string,
    ): Promise<void> {
        await this.interactionService.publishErrors(botId, workspaceId);
    }

    @Put(':workspaceId/bots/:botId/interactions/:interactionId/publish')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    @ApiParam({ name: 'interactionId', description: 'interaction id', type: String, required: true })
    public async publishInteraction(
        @Param('botId') botId: string,
        @Param('workspaceId') workspaceId: string,
        @Param('interactionId') interactionId: string,
        @UserDecorator() user: User,
    ): Promise<void> {
        await this.interactionService.publishInteraction(botId, workspaceId, user, interactionId);
    }

    @Get(':workspaceId/bots/:botId/interactions/pending')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    public async getInteractionsPendingPublication(
        @Param('botId') botId: string,
        @Param('workspaceId') workspaceId: string,
    ): Promise<void> {
        await this.interactionService.interactionsPendingPublication(botId, workspaceId);
    }

    @Get(':workspaceId/bots/:botId/interactions/interactions-before-last-changes')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    public async getInteractionsBeforeChange(
        @Param('botId') botId: string,
        @Param('workspaceId') workspaceId: string,
    ): Promise<any> {
        return await this.interactionService.getInteractionsBeforeLastChanges(workspaceId, botId);
    }

    @Post(':workspaceId/bots/:botId/interactions')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    async save(
        @Param('workspaceId') workspaceId: string,
        @Param('botId') botId: string,
        @Body() interactionDto: InteractionDto,
        @UserDecorator() user: User,
    ) {
        const timer = userAccessLatency.labels(user.name, 'create_iteraction', workspaceId).startTimer();

        const newInteraction = new InteractionModel();
        Object.assign(newInteraction, interactionDto, {
            workspaceId: castObjectId(workspaceId),
            botId: castObjectId(botId),
        });
        const r = await this.interactionService.createInteraction(newInteraction, castObjectIdToString(user._id));
        timer();
        return r;
    }

    @Put(':workspaceId/bots/:botId/interactions/:interactionId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    @ApiParam({ name: 'interactionId', description: 'interaction id', type: String, required: true })
    async update(
        @Param('workspaceId') workspaceId: string,
        @Param('interactionId') interactionId: string,
        @Body() interactionDto: InteractionDto,
        @UserDecorator() user: User,
    ) {
        const timer = userAccessLatency.labels(user.name, 'update_iteraction', workspaceId).startTimer();
        const updateInteraction = new InteractionModel();
        Object.assign(updateInteraction, interactionDto, {
            workspaceId: castObjectId(workspaceId),
        });
        updateInteraction._id = interactionId;
        const r = await this.interactionService.updateInteraction(
            updateInteraction,
            false,
            castObjectIdToString(user._id),
        );
        timer();
        return r;
    }

    @Delete(':workspaceId/bots/:botId/interactions/:interactionId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'interactionId', description: 'interaction id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    async delete(
        @Param('interactionId') interactionId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        const timer = userAccessLatency.labels(user.name, 'delete_iteraction', workspaceId).startTimer();
        const r = await this.interactionService.deleteInteraction(interactionId, user);
        timer();
        return r;
    }

    @Get(':workspaceId/bots/:botId/interactions/:interactionId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    @ApiParam({ name: 'interactionId', description: 'interaction id', type: String, required: true })
    async getOne(@Param('interactionId') interactionId: string) {
        return await this.interactionService.getOne(interactionId);
    }

    @Get(':workspaceId/bots/:botId/interactions')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    async getAll(
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }, { botId: 'botId' }],
        })
        query: QueryStringFilter,
    ) {
        return await this.interactionService.queryPaginate(query, 'GET_INTERACTIONS');
    }

    @Get(':workspaceId/bots/:botId/interactions/:interactionId/path')
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    @ApiParam({ name: 'interactionId', description: 'interaction id', type: String, required: true })
    async getPath(@Param('interactionId') interactionId: string) {
        return await this.interactionService.getPath(interactionId);
    }

    @Post(':workspaceId/bots/:botId/interactions/:interactionId/comments')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    @ApiParam({ name: 'interactionId', description: 'interaction id', type: String, required: true })
    createComment(
        @Param('interactionId') interactionId: string,
        @Body() comment: CommentDto,
        @UserDecorator() user: User,
    ) {
        return this.interactionService.createComment(interactionId, comment, user);
    }
}
