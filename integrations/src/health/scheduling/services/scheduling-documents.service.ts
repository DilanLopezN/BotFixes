import { Injectable } from '@nestjs/common';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { UploadDocument } from '../../documents/interfaces/upload-document.interface';
import { DocumentsService } from '../../documents/documents.service';
import { DocumentFileType } from '../interfaces/documents/list-document-types-response.interface';
import { DeleteDocument } from '../interfaces/documents/delete-document.interface';
import { ListDocuments, UploadedDocument } from '../interfaces/documents/list-documents.interface';

@Injectable()
export class SchedulingDocumentsService {
  constructor(private readonly documentsService: DocumentsService) {}

  public async uploadDocument(integrationId: string, data: UploadDocument): Promise<OkResponse> {
    return await this.documentsService.uploadDocument({
      appointmentTypeCode: data.appointmentTypeCode,
      file: data.file,
      fileTypeCode: data.fileTypeCode,
      integrationId,
      patientCode: data.patientCode,
      scheduleCode: data.scheduleCode,
      description: data.description,
      source: data.source,
    });
  }

  public async listDocumentTypes(integrationId: string): Promise<DocumentFileType[]> {
    return await this.documentsService.listDocumentTypes(integrationId);
  }

  public async listDocuments(integrationId: string, data: ListDocuments): Promise<UploadedDocument[]> {
    return await this.documentsService.listAllDocumentsForSchedule({
      ...data,
      integrationId,
    });
  }

  public async deleteDocument(integrationId: string, data: DeleteDocument): Promise<OkResponse> {
    return await this.documentsService.deleteDocument({
      ...data,
      integrationId,
    });
  }

  public async getDocumentsCountForSchedule(integrationId: string, scheduleCode: string): Promise<number> {
    return await this.documentsService.getDocumentsCountForSchedule(integrationId, scheduleCode);
  }
}
