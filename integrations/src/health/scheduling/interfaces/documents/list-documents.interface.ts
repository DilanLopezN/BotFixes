interface ListDocuments {
  scheduleCode: string;
  patientCode: string;
}

interface UploadedDocument {
  id: string;
  originalName: string;
  fileTypeCode: string;
  createdAt: Date;
  url: string;
  extension: string;
}

export type { ListDocuments, UploadedDocument };
