import { PredefinedRoles } from '../../../common/utils/utils';
import { ApiTags } from '@nestjs/swagger';
import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { UserDecorator } from '../../../decorators/user.decorator';
import { User } from '../../users/interfaces/user.interface';
import * as moment from 'moment';
import { IntentsService } from '../services/intents.service';

@Controller('workspaces')
@ApiTags('intents')
export class IntentsController {
    constructor(private readonly intentsService: IntentsService) {}

    @Get(':workspaceId/bot/:botId/intents')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async getIntentsByWorkspaceAndBot(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('botId') botId: string,
    ) {
        return await this.intentsService.getIntentsByWorkspaceAndBot(workspaceId, botId);
    }
}
