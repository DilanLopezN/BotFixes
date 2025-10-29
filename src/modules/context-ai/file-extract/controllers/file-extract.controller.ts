import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleData, RolesDecorator } from '../../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../../common/utils/utils';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { RolesGuard } from '../../../users/guards/roles.guard';
import { FileExtractService } from '../services/file-extract.service';
import { ExtractionResult } from '../interfaces/file-extract.interface';
import { ExtractDto } from '../dto/extract.dto';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
    PredefinedRoles.WORKSPACE_ADMIN,
];

@Controller('workspaces/:workspaceId/conversation-ai/file-extract')
export class FileExtractController {
    constructor(private readonly fileExtractService: FileExtractService) {}

    @HttpCode(HttpStatus.OK)
    @Post('/extract')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('file'))
    async extractDataFromImage(
        @Param('workspaceId') workspaceId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() extractDto: ExtractDto,
    ): Promise<ExtractionResult> {
        return await this.fileExtractService.extractDataFromImage({
            workspaceId,
            file,
            extractionType: extractDto.extractionType,
        });
    }
}
