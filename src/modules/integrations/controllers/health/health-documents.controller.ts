import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    ValidationPipe,
    UseGuards,
    UploadedFile,
    BadRequestException,
    UseInterceptors,
    HttpCode,
    HttpStatus,
    Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../../auth/guard/auth.guard';
import { User } from '../../../users/interfaces/user.interface';
import { UserDecorator } from '../../../../decorators/user.decorator';
import { AuthenticatePatientDto, DocumentUploadDto, ListDocumentsDto } from '../../dto/health/healt-documents.dto';
import { HealthDocumentsService } from '../../services/health/health-documents.service';

@UseGuards(AuthGuard)
@Controller('workspaces/:workspaceId/integrations-documents')
export class HealthDocumentsController {
    constructor(private readonly healthDocumentsService: HealthDocumentsService) {}

    @HttpCode(HttpStatus.OK)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @Headers('X-Patient-Auth') authToken: string,
        @Body(new ValidationPipe({ transform: true })) body: DocumentUploadDto,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
        @UploadedFile() file: any,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        return await this.healthDocumentsService.uploadDocument({
            ...body,
            workspaceId,
            file,
            user,
            authToken,
        });
    }

    @HttpCode(HttpStatus.OK)
    @Post('listDocuments')
    async listDocuments(
        @Headers('X-Patient-Auth') authToken: string,
        @Body(new ValidationPipe()) body: ListDocumentsDto,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthDocumentsService.listDocuments({
            workspaceId,
            ...body,
            user,
            authToken,
        });
    }

    @HttpCode(HttpStatus.OK)
    @Post('listDocumentTypes')
    async listDocumentTypes(
        @Headers('X-Patient-Auth') authToken: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthDocumentsService.listDocumentTypes({
            workspaceId,
            user,
            authToken,
        });
    }

    @HttpCode(HttpStatus.OK)
    @Post('listPatientSchedules')
    async listPatientSchedules(
        @Headers('X-Patient-Auth') authToken: string,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthDocumentsService.listPatientSchedules({
            workspaceId,
            user,
            authToken,
        });
    }

    @HttpCode(HttpStatus.OK)
    @Get('getStatus')
    async checkDocumentUploadStatus(@Param('workspaceId') workspaceId: string, @UserDecorator() user: User) {
        return await this.healthDocumentsService.checkDocumentUploadStatus({
            workspaceId,
            user,
        });
    }

    @HttpCode(HttpStatus.OK)
    @Post('authenticatePatient')
    async authenticatePatient(
        @Body(new ValidationPipe()) body: AuthenticatePatientDto,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
    ) {
        return await this.healthDocumentsService.authenticatePatient({
            workspaceId,
            user,
            patientCpf: body.patientCpf,
        });
    }
}
