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
}

interface SignedSimplifiedDocument {
  id: string;
  originalName: string;
  fileTypeCode: string;
  createdAt: Date;
  url: string;
  extension: string;
  externalId?: string;
}

export type { ListDocuments, SimplifiedDocument, SignedSimplifiedDocument };
