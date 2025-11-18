export interface PatientUploadFile {
  fileName: string;
  fileUrl: string;
  scheduleCode: string;
  description?: string;
  mimeType: string;
  hash: string;
  extension: string;
  appointmentTypeCode: string;
  patientCode: string;
  fileTypeCode: string;
}
