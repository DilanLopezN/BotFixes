export interface AgentUploadFile {
  fileName: string;
  fileUrl: string;
  erpUsername: string;
  scheduleCode: string;
  description?: string;
  mimeType: string;
  hash: string;
  extension: string;
  appointmentTypeCode: string;
  patientCode: string;
  fileTypeCode: string;
}
