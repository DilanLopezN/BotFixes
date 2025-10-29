import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
    ValidationPipe,
    HttpException,
} from '@nestjs/common';
import { DefaultResponse } from '../../../common/interfaces/default';
import { DoQuestionDto } from './dto/do-question.dto';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { MessageAggregationStorageService } from './storage/message-aggregation-storage.service';
import { PendingMessage } from './dto/pending-message.dto';
import { ExecuteResponse } from './interfaces/context-execute.interface';
import { v4 } from 'uuid';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@Controller('workspaces/:workspaceId/context-ai-implementor')
export class ContextAiImplementorController {
    constructor(private readonly messageAggregationService: MessageAggregationStorageService) {}

    @HttpCode(HttpStatus.OK)
    @Post('doQuestion')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async doQuestion(
        @Body(new ValidationPipe()) dto: DoQuestionDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ExecuteResponse>> {
        const pendingMessage: PendingMessage = {
            messageId: v4(),
            text: dto.question,
            workspaceId,
            ...dto,
            timestamp: new Date(),
        };

        try {
            return await this.messageAggregationService.processQuestionWithAggregation(pendingMessage);
        } catch (error) {
            if (error.statusCode === 409 && error.error === 'MESSAGE_AGGREGATED') {
                throw new HttpException(
                    {
                        message: error.message,
                        error: error.error,
                        statusCode: 409,
                    },
                    HttpStatus.CONFLICT,
                );
            }

            throw error;
        }
    }
}
