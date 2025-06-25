import {
    Controller,
    Param,
    Query,
    Post,
    Body,
    Put,
    Delete,
    Get,
    ValidationPipe,
    UsePipes,
    UseGuards,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { BotDto } from './dtos/botDto.dto';
import { castObjectId, PredefinedRoles } from '../../common/utils/utils';
import { BotModel } from './schemas/bot.schema';
import { AuthGuard } from '../auth/guard/auth.guard';
import { User } from '../users/interfaces/user.interface';
import { UserDecorator } from '../../decorators/user.decorator';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';

@ApiTags('Bots')
@Controller('workspaces')
export class BotsController {
    constructor(private readonly botService: BotsService) {}

    @Put(':workspaceId/bots/:botId/interactions/publish')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'botId', description: 'bot id', type: String, required: true })
    public async publish(
        @Param('botId') botId: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ): Promise<void> {
        await this.botService.publish(botId, workspaceId, user);
    }

    @Post(':workspaceId/bots')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async save(@Param('workspaceId') workspaceId: string, @Query('cloned') cloned, @Body() botDto: BotDto) {
        const newBot = new BotModel();
        Object.assign(newBot, botDto, { workspaceId: castObjectId(workspaceId) });
        return await this.botService.createBot(newBot, cloned);
    }

    @Put(':workspaceId/bots/:botId')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @UseGuards(AuthGuard)
    @ApiParam({ name: 'botId', type: String })
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(@Param('botId') botId: string, @Body() botDto: BotDto, @UserDecorator() user: User) {
        return await this.botService._update(botId, botDto, user);
    }

    @Delete(':workspaceId/bots/:botId')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @UseGuards(AuthGuard)
    async delete(@Param('botId') botId: string) {
        return await this.botService._delete(botId);
    }

    @Get(':workspaceId/bots/:botId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @UseGuards(AuthGuard, RolesGuard)
    async getOne(@Param('botId') botId: string) {
        return await this.botService.getOne(botId);
    }

    @Get(':workspaceId/bots')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getAll(
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }],
        })
        query: QueryStringFilter,
    ) {
        return await this.botService.queryByRoles(user, query, workspaceId);
    }

    @Get('/:workspaceId/bots/:botId/config')
    @ApiParam({ name: 'botId', type: String, required: true, description: 'bot id' })
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    getBotConfig(@Param('workspaceId') workspaceId: string, @Param('botId') botId: string) {
        return this.botService.getInfoBotConfig(null, botId);
    }
}
