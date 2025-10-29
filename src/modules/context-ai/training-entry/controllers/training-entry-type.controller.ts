import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { TrainingEntryTypeService } from '../training-entry-type.service';
import { TrainingEntryType } from '../entities/training-entry-type.entity';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@Controller('workspaces/:workspaceId/conversation-ai/training-entry-type')
export class TrainingEntryTypeController {
    constructor(private readonly trainingEntryTypeService: TrainingEntryTypeService) {}

    @HttpCode(HttpStatus.OK)
    @Post('createTrainingEntryType')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createTrainingEntryType(
        @Body(new ValidationPipe()) dto: { name: string },
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntryType>> {
        return await this.trainingEntryTypeService.create(workspaceId, dto.name);
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateTrainingEntryType')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateTrainingEntryType(
        @Body(new ValidationPipe()) dto: { id: string; name: string },
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntryType>> {
        return await this.trainingEntryTypeService.update(workspaceId, dto.id, dto.name);
    }

    @HttpCode(HttpStatus.OK)
    @Post('listTrainingEntryTypes')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listTrainingEntryTypes(
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntryType[]>> {
        return await this.trainingEntryTypeService.list(workspaceId);
    }

    @HttpCode(HttpStatus.OK)
    @Post('getTrainingEntryType')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getTrainingEntryType(
        @Body(new ValidationPipe()) dto: { id: string },
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntryType>> {
        return await this.trainingEntryTypeService.getById(workspaceId, dto.id);
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteTrainingEntryType')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteTrainingEntryType(
        @Body(new ValidationPipe()) dto: { id: string },
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntryType>> {
        return await this.trainingEntryTypeService.delete(workspaceId, dto.id);
    }
}