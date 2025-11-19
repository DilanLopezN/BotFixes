import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { File } from '../../common/interfaces/uploaded-file';
import { DocumentUploadDto } from './dto/document-upload.dto';
import { DeleteDocumentDto } from './dto/delete-document.dto';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { UploadDocumentResponse } from './interfaces/upload-document.interface';
import { SignedSimplifiedDocument } from './interfaces/list-documents.interface';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { DocumentFileType } from './interfaces/list-document-types.interface';
import { ALLOWED_MIMED_TYPES, FILE_SIZE_LIMIT } from './default';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatePatientDto } from './dto/authenticate-patient.dto';
import { DocumentsAuthGuard } from '../../common/guards/documents.guard';
import { decodeToken } from '../../common/helpers/decode-token';
import { PatientTokenData } from './interfaces/patient-token-data.interface';
import { Appointment } from '../interfaces/appointment.interface';
import { DocumentSourceType } from './interfaces/documents.interface';

@ApiTags('documents')
@Controller({
  path: 'integration',
})
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(DocumentsAuthGuard)
  @Post('/health/documents/uploadDocument')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: FILE_SIZE_LIMIT },
      fileFilter: (_, file, cb) => {
        if (ALLOWED_MIMED_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não suportado'), false);
        }
      },
    }),
  )
  async uploadDocument(
    @Headers('Authorization') authToken: string,
    @UploadedFile() file: File,
    @Body(new ValidationPipe()) data: DocumentUploadDto,
  ): Promise<UploadDocumentResponse> {
    const tokenData = decodeToken<PatientTokenData>(authToken, process.env.DOCUMENTS_JWT_SECRET_KEY);

    if (!tokenData?.patientCode) {
      throw new BadRequestException('Invalid token: patientCode is required');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.uploadDocument({
      integrationId: tokenData.integrationId,
      patientCode: tokenData.patientCode,
      source: DocumentSourceType.external,
      erpUsername: tokenData.erpUsername,
      file,
      ...data,
    });
  }

  @UseGuards(DocumentsAuthGuard)
  @Post('/health/documents/deleteDocument')
  @HttpCode(HttpStatus.OK)
  async deleteDocument(
    @Headers('Authorization') authToken: string,
    @Body(new ValidationPipe()) data: DeleteDocumentDto,
  ): Promise<OkResponse> {
    const tokenData = decodeToken<PatientTokenData>(authToken, process.env.DOCUMENTS_JWT_SECRET_KEY);

    if (!tokenData?.patientCode) {
      throw new BadRequestException('Invalid token: patientCode is required');
    }

    return this.documentsService.deleteDocument({
      integrationId: tokenData.integrationId,
      ...data,
    });
  }

  @UseGuards(DocumentsAuthGuard)
  @Post('/health/documents/listDocuments')
  @HttpCode(HttpStatus.OK)
  async listDocuments(
    @Headers('Authorization') authToken: string,
    @Body(new ValidationPipe()) data: ListDocumentsDto,
  ): Promise<SignedSimplifiedDocument[]> {
    const tokenData = decodeToken<PatientTokenData>(authToken, process.env.DOCUMENTS_JWT_SECRET_KEY);

    if (!tokenData?.patientCode) {
      throw new BadRequestException('Invalid token: patientCode is required');
    }

    return this.documentsService.listAllDocumentsForSchedule({
      integrationId: tokenData.integrationId,
      patientCode: tokenData.patientCode,
      ...data,
    });
  }

  @UseGuards(DocumentsAuthGuard)
  @Post('/health/documents/listDocumentTypes')
  @HttpCode(HttpStatus.OK)
  async listDocumentTypes(@Headers('Authorization') authToken: string): Promise<DocumentFileType[]> {
    const tokenData = decodeToken<PatientTokenData>(authToken, process.env.DOCUMENTS_JWT_SECRET_KEY);

    if (!tokenData?.patientCode) {
      throw new BadRequestException('Invalid token: patientCode is required');
    }

    return this.documentsService.listDocumentTypes(tokenData.integrationId);
  }

  @UseGuards(DocumentsAuthGuard)
  @Post('/health/documents/listPatientSchedules')
  @HttpCode(HttpStatus.OK)
  async listPatientSchedules(@Headers('Authorization') authToken: string): Promise<Appointment[]> {
    const tokenData = decodeToken<PatientTokenData>(authToken, process.env.DOCUMENTS_JWT_SECRET_KEY);

    if (!tokenData?.patientCode) {
      throw new BadRequestException('Invalid token: patientCode is required');
    }

    return this.documentsService.listPatientSchedules({
      erpUsername: tokenData.erpUsername,
      patientCpf: tokenData.patientCpf,
      patientCode: tokenData.patientCode,
      integrationId: tokenData.integrationId,
    });
  }

  @UseGuards(AuthGuard)
  @Post(':integrationId/health/documents/authenticatePatient')
  @HttpCode(HttpStatus.OK)
  async authenticatePatient(
    @Body(new ValidationPipe()) data: AuthenticatePatientDto,
    @Param('integrationId') integrationId: string,
  ): Promise<string> {
    return this.documentsService.authenticatePatient({
      ...data,
      integrationId,
    });
  }
}
