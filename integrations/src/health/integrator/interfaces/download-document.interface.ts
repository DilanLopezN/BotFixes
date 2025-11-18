export interface DownloadDocumentData {
  scheduleCode: string;
  patientCode: string;
  type: 'guidance';
}

export interface ListAvailableMedicalReportsRequest {
  authToken: string;
}

export interface ListAvailableMedicalReportsFilterRequest {
  scheduleCode?: string;
  patientCode?: string;
}

export interface CountAvailableMedicalReportsResponse<T> {
  count: number;
  data: Array<T>;
}

export interface ListAvailableMedicalReports {
  link: string;
  scheduleCode: string;
}

export interface AvailableMedicalReportsByScheduleCode {
  scheduleCode: string;
  groupScheduleCode: string;
  scheduleDate: string;
  procedureName?: string;
  reportLinks: { modality: string; link: string }[];
}
export interface ListAvailableMedicalReportsByPatientCode {
  patientName: string;
  schedulings: AvailableMedicalReportsByScheduleCode[];
}

export interface ListAvailableMedicalReportsTokenData extends ValidPatientReportDownloadRequest {}

export interface ValidatePatientReportDownloadResponse {
  token: string;
}

export interface ValidPatientReportDownloadRequest {
  patientCpf: string;
  patientBirthDate: string;
  patientMotherName?: string;
  protocolCode?: string;
  patientCode?: string;
  shortId?: string;
}

export interface HasAvailableMedicalReportsFilterRequest {
  scheduleCode?: string;
}

export interface HasAvailableMedicalReportsFilterResponse {
  ok: boolean;
}
