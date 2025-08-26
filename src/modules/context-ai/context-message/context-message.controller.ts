import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { DefaultResponse } from '../../../common/interfaces/default';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { ContextMessageService } from './context-message.service';
import { GetConsumedTokensDto } from './dto/get-consumed-tokens';
import { GetConsumedTokensResponse } from './interfaces/get-consumed-tokens';
import { ListContextMessagesDto } from './dto/list-context-messages.dto';
import { ContextMessagePair } from './interfaces/list-context-messages.interface';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

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

    @HttpCode(HttpStatus.OK)
    @Post('listContextMessages')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listContextMessages(
        @Body(new ValidationPipe()) dto: ListContextMessagesDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ContextMessagePair[]>> {
        const { data, count } = await this.contextMessageService.listContextMessagesByWorkspaceId(workspaceId, dto);
        return {
            data,
            metadata: {
                count,
                skip: dto.skip ?? 0,
                limit: dto.limit ?? 10,
            },
        };
    }
}
