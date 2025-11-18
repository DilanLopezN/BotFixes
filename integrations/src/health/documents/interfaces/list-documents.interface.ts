interface ListDocuments {
  integrationId: string;
  scheduleCode: string;
  patientCode: string;
}

interface SimplifiedDocument {
  id: string;
  originalName: string;
  fileTypeCode: string;
  createdAt: Date;
  url: string;
  extension: string;
}

export type { ListDocuments, SimplifiedDocument };
