import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { DefaultResponse } from '../../../common/interfaces/default';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { ContextFallbackMessageService } from './context-fallback-message.service';
import { IContextFallbackMessage } from './interfaces/context-fallback-message.interface';
import { ListFallbackMessagesDto } from './dto/list-fallback-messages.dto';

@Controller('workspaces/:workspaceId/conversation-ai/context-fallback-message')
export class ContextFallbackMessageController {
    constructor(private readonly contextFallbackMessageService: ContextFallbackMessageService) {}

    @HttpCode(HttpStatus.OK)
    @Post('listFallbackMessages')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listFallbackMessages(
        @Body(new ValidationPipe()) dto: ListFallbackMessagesDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<IContextFallbackMessage[]>> {
        const result = await this.contextFallbackMessageService.listgFallbackMessagesByWorkspaceId(workspaceId, dto);
        return {
            data: result,
        };
    }
}
