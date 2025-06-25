import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { RoleData, RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { DefaultResponse } from '../../../common/interfaces/default';
import { DoTrainingDto } from './dto/do-training.dto';
import { GetConsumedTokensDto } from './dto/get-consumed-tokens';
import { GetConsumedTokensResponse } from './interfaces/get-consumed-tokens';
import { ExecutedTrainingService } from './executed-training.service';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
    PredefinedRoles.WORKSPACE_ADMIN,
];

@Controller('workspaces/:workspaceId/conversation-ai/training-entry')
export class ExecutedTrainingsController {
    constructor(private readonly executedTrainingService: ExecutedTrainingService) {}

    @HttpCode(HttpStatus.OK)
    @Post('doTraining')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async doTraining(
        @Body(new ValidationPipe()) dto: DoTrainingDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<{ success: number; total: number }>> {
        return await this.executedTrainingService.doTraining(workspaceId, dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('getConsumedTokens')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async doQuestion(
        @Body(new ValidationPipe()) dto: GetConsumedTokensDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<GetConsumedTokensResponse[]>> {
        return await this.executedTrainingService.getConsumedTokens(workspaceId, dto);
    }
}
