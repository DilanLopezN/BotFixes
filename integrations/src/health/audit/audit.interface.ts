export enum AuditDataType {
  internalRequest = 1,
  internalResponse = 2,
  externalRequest = 3,
  externalResponse = 4,
  code = 5,
  externalResponseError = 6,
}

export interface CreateAudit {
  integrationId: string;
  conversationId?: string;
  data: any;
  dataType: AuditDataType;
  ctxId: string;
  identifier?: string;
}

export enum AuditIdentifier {
  interAppointment = 'interAppointment',
  listPreviousInsurances = 'listPreviousInsurances',
  matrixRecoverPassword = 'matrixRecoverPassword',
  uploadDocumentFailed = 'uploadDocumentFailed',
}

export type CreateAuditDefault = Omit<CreateAudit, 'conversationId' | 'patientPhone' | 'ctxId'>;
