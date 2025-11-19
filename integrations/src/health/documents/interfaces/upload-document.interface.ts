import { File } from '../../../common/interfaces/uploaded-file';
import { DocumentSourceType } from './documents.interface';

export interface UploadDocument {
  integrationId: string;
  file: File;
  scheduleCode: string;
  description?: string;
  appointmentTypeCode: string;
  fileTypeCode: string;
  patientCode: string;
  externalId?: string;
  erpUsername?: string;
  source: DocumentSourceType;
}

export interface UploadDocumentResponse {
  ok: boolean;
  message?: string;
}
