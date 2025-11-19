interface IDocuments {
  integrationId: string;
  scheduleCode?: string;
  name: string;
  originalName: string;
  description?: string;
  s3Key: string;
  mimeType: string;
  extension: string;
  hash: string;
  patientCode: string;
  fileTypeCode: string;
  appointmentTypeCode: string;
  source: DocumentSourceType;
  erpUsername?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  erpCreatedAt?: Date;
  retryCount: number;
}

enum DocumentSourceType {
  patient_portal = 'patient_portal',
  external = 'external',
}

export type { IDocuments };
export { DocumentSourceType };
