import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { DefaultResponse } from '../../../common/interfaces/default';
import { DoQuestionDto } from './dto/do-question.dto';
import { RolesGuard } from '../../users/guards/roles.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RoleData, RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { ContextAiImplementorService } from './services/context-ai-implementor.service';
import { ExecuteResponse } from './interfaces/context-execute.interface';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
    PredefinedRoles.WORKSPACE_ADMIN,
];

@Controller('workspaces/:workspaceId/context-ai-implementor')
export class ContextAiImplementorController {
    constructor(private readonly contextAiImplementorService: ContextAiImplementorService) {}

    @HttpCode(HttpStatus.OK)
    @Post('doQuestion')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async doQuestion(
        @Body(new ValidationPipe()) dto: DoQuestionDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ExecuteResponse>> {
        return await this.contextAiImplementorService.doQuestion(workspaceId, dto);
    }
}
