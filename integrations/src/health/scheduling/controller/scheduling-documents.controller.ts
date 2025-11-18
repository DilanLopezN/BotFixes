import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { decodeToken } from '../../../common/helpers/decode-token';
import { ScheduleEventType } from '../interfaces/scheduling-events.interface';
import { SchedulingEventsService } from '../services/scheduling-events.service';
import { ApiTags } from '@nestjs/swagger';
import { SchedulingAuthGuard } from '../../../common/guards/scheduling.guard';
import { SchedulingDocumentsService } from '../services/scheduling-documents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { File } from '../../../common/interfaces/uploaded-file';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { ListSchedules } from '../interfaces/list-schedules.interface';
import { UploadDocumentDto } from '../dto/documents/upload-document.dto';
import { ListDocumentTypesResponse } from '../interfaces/documents/list-document-types-response.interface';
import { DeleteDocumentDto } from '../dto/documents/delete-document.dto';
import { ListDocumentsDto } from '../dto/documents/list-documents.dto';
import { UploadedDocument } from '../interfaces/documents/list-documents.interface';
import { ALLOWED_MIMED_TYPES, FILE_SIZE_LIMIT } from '../../documents/default';

@ApiTags('Documents')
@Controller({
  path: 'client/:integrationId/scheduling/documents',
})
export class SchedulingDocumentsController {
  constructor(
    private readonly schedulingEventsService: SchedulingEventsService,
    private readonly schedulingDocumentsService: SchedulingDocumentsService,
  ) {}

  @UseGuards(SchedulingAuthGuard)
  @HttpCode(HttpStatus.OK)
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
  @Post('uploadDocument')
  async uploadDocument(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @UploadedFile() file: File,
    @Headers('Authorization') authToken: string,
    @Body(new ValidationPipe()) data: UploadDocumentDto,
  ): Promise<OkResponse> {
    const tokenData = decodeToken<ListSchedules>(authToken, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!tokenData?.patientErpCode || !tokenData?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    try {
      await this.schedulingEventsService.createEvent({
        integrationId,
        shortId: tokenData.shortId,
        type: ScheduleEventType.uploadDocument,
        scheduleCode: data.scheduleCode || undefined,
      });
    } catch (error) {
      console.error(error);
    }

    return this.schedulingDocumentsService.uploadDocument(integrationId, {
      ...data,
      patientCode: tokenData.patientErpCode,
      file,
      integrationId,
    });
  }

  @UseGuards(SchedulingAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('listDocumentTypes')
  async listDocumentTypes(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') authToken: string,
  ): Promise<ListDocumentTypesResponse> {
    const tokenData = decodeToken<ListSchedules>(authToken, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!tokenData?.patientErpCode || !tokenData?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    return await this.schedulingDocumentsService.listDocumentTypes(integrationId);
  }

  @UseGuards(SchedulingAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('listDocuments')
  async listDocuments(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') authToken: string,
    @Body(new ValidationPipe()) data: ListDocumentsDto,
  ): Promise<UploadedDocument[]> {
    const tokenData = decodeToken<ListSchedules>(authToken, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!tokenData?.patientErpCode || !tokenData?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    return await this.schedulingDocumentsService.listDocuments(integrationId, {
      ...data,
      patientCode: tokenData.patientErpCode,
    });
  }

  @UseGuards(SchedulingAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('deleteDocument')
  async deleteDocument(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') authToken: string,
    @Body(new ValidationPipe()) data: DeleteDocumentDto,
  ): Promise<OkResponse> {
    const tokenData = decodeToken<ListSchedules>(authToken, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!tokenData?.patientErpCode || !tokenData?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    try {
      await this.schedulingEventsService.createEvent({
        integrationId,
        shortId: tokenData.shortId,
        type: ScheduleEventType.deleteDocument,
        scheduleCode: data.scheduleCode || undefined,
      });
    } catch (error) {
      console.error(error);
    }

    return await this.schedulingDocumentsService.deleteDocument(integrationId, {
      ...data,
      patientCode: tokenData.patientErpCode,
    });
  }
}
