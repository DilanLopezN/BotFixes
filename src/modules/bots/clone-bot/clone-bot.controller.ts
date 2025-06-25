import { Controller, Param, Post, Body, ValidationPipe, UsePipes, UseGuards } from '@nestjs/common';
import { CloneBotService } from './clone-bot.service';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CloneBotDto } from './dto/clone-bot.dto';

@ApiTags('CloneBot')
@Controller('workspaces')
export class CloneBotController {
    constructor(private readonly cloneBotService: CloneBotService) {}

    @Post(':workspaceId/bots/clone-bot')
    @ApiParam({ name: 'workspaceId', type: String, required: true, description: 'workspace id' })
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async cloneBot(@Param('workspaceId') workspaceId: string, @Body() body: CloneBotDto) {
        return await this.cloneBotService.cloneBot(
            body.cloneFromWorkspaceId,
            body.cloneFromBotId,
            workspaceId,
            body.botName,
            true,
            body.createTeams,
        );
    }
}
