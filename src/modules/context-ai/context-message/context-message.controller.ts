import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { DefaultResponse } from '../../../common/interfaces/default';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { ContextMessageService } from './context-message.service';
import { GetConsumedTokensDto } from './dto/get-consumed-tokens';
import { GetConsumedTokensResponse } from './interfaces/get-consumed-tokens';

@Controller('workspaces/:workspaceId/conversation-ai/context-message')
export class ContextMessageController {
    constructor(private readonly contextMessageService: ContextMessageService) {}

    @HttpCode(HttpStatus.OK)
    @Post('getConsumedTokens')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async doQuestion(
        @Body(new ValidationPipe()) dto: GetConsumedTokensDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<GetConsumedTokensResponse[]>> {
        return await this.contextMessageService.getConsumedTokens(workspaceId, dto);
    }
}
