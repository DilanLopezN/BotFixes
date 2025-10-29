import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
    ValidationPipe,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { TrainingEntryService } from '../training-entry.service';
import { CreateTrainingEntryDto } from '../dto/create-training-entry.dto';
import { TrainingEntry } from '../entities/training-entry.entity';
import { DeleteTrainingEntryDto } from '../dto/delete-training-entry.dto';
import { UpdateTrainingEntryDto } from '../dto/update-training-entry.dto';
import { GetTrainingEntryDto } from '../dto/get-training-entry.dto';
import { BulkUploadTrainingEntryDto } from '../dto/bulk-upload-training-entry.dto';
import { ListTrainingEntriesDto } from '../dto/list-training-entries.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileMimetypeFilter } from '../../../../common/file-uploader/file-mimetype-filter';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@Controller('workspaces/:workspaceId/conversation-ai/training-entry')
export class TrainingEntryController {
    constructor(private readonly trainingEntryService: TrainingEntryService) {}

    @HttpCode(HttpStatus.OK)
    @Post('createTrainingEntry')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async createTrainingEntry(
        @Body(new ValidationPipe()) dto: CreateTrainingEntryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntry>> {
        return await this.trainingEntryService.createTrainingEntry(workspaceId, dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('updateTrainingEntry')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async updateTrainingEntry(
        @Body(new ValidationPipe()) dto: UpdateTrainingEntryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntry>> {
        return await this.trainingEntryService.updateTrainingEntry(workspaceId, dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('listTrainingEntries')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async listTrainingEntries(
        @Body(new ValidationPipe()) dto: ListTrainingEntriesDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntry[]>> {
        return await this.trainingEntryService.listTrainingEntries(workspaceId, dto.agentId);
    }

    @HttpCode(HttpStatus.OK)
    @Post('getTrainingEntry')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getTrainingEntry(
        @Body(new ValidationPipe()) dto: GetTrainingEntryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntry>> {
        return await this.trainingEntryService.getTrainingEntry(workspaceId, dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('deleteTrainingEntry')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async deleteTrainingEntry(
        @Body(new ValidationPipe()) dto: DeleteTrainingEntryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<TrainingEntry>> {
        return await this.trainingEntryService.deleteTrainingEntry(workspaceId, dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('bulkUpload')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            fileFilter: fileMimetypeFilter(['csv', 'xlsx', 'xls']),
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async bulkUploadTrainingEntries(
        @UploadedFile() file: Express.Multer.File,
        @Body(new ValidationPipe()) dto: BulkUploadTrainingEntryDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<{ created: number; errors: string[] }>> {
        if (!file) {
            throw new Error('File is required');
        }

        return await this.trainingEntryService.bulkUploadTrainingEntries(
            workspaceId,
            dto.agentId,
            file.buffer,
            file.originalname,
        );
    }
}
