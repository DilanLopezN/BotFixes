import { File } from '../../../common/interfaces/uploaded-file';

export interface UploadDocument {
  integrationId: string;
  file: File;
  scheduleCode: string;
  description?: string;
  appointmentTypeCode: string;
  fileTypeCode: string;
  patientCode: string;
}

export interface UploadDocumentResponse {
  ok: boolean;
  message?: string;
}
