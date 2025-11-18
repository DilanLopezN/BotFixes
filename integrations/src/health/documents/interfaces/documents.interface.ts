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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  erpCreatedAt?: Date;
}

export type { IDocuments };
