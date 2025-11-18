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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { File } from '../../common/interfaces/uploaded-file';
import { DocumentUploadDto } from './dto/document-upload.dto';
import { ObjectIdPipe } from '../../common/pipes/objectId.pipe';
import { DeleteDocumentDto } from './dto/delete-document.dto';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { UploadDocumentResponse } from './interfaces/upload-document.interface';
import { SimplifiedDocument } from './interfaces/list-documents.interface';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { DocumentFileType } from './interfaces/list-document-types.interface';
import { ALLOWED_MIMED_TYPES, FILE_SIZE_LIMIT } from './default';

@ApiTags('documents')
@Controller({
  path: 'integration/:integrationId/health/documents',
})
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('uploadDocument')
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
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @UploadedFile() file: File,
    @Body(new ValidationPipe()) data: DocumentUploadDto,
  ): Promise<UploadDocumentResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.uploadDocument({
      integrationId,
      file,
      ...data,
    });
  }

  @Post('deleteDocument')
  @HttpCode(HttpStatus.OK)
  async deleteDocument(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) data: DeleteDocumentDto,
  ): Promise<OkResponse> {
    return this.documentsService.deleteDocument({
      integrationId,
      ...data,
    });
  }

  @Post('listDocuments')
  @HttpCode(HttpStatus.OK)
  async listDocuments(
    @Param('integrationId') integrationId: string,
    @Body(new ValidationPipe()) data: ListDocumentsDto,
  ): Promise<SimplifiedDocument[]> {
    return this.documentsService.listDocumentsForSchedule({
      integrationId,
      ...data,
    });
  }

  @Post('listDocumentTypes')
  @HttpCode(HttpStatus.OK)
  async listDocumentTypes(@Param('integrationId') integrationId: string): Promise<DocumentFileType[]> {
    return this.documentsService.listDocumentTypes(integrationId);
  }
}
