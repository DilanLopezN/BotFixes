export interface DownloadTokenData {
  integrationId: string;
  patientErpCode: string;
  shortId: string;
  scheduleCode?: string;
}

export interface DownloadMedicalReportTokenData extends DownloadTokenData {
  medicalReportCode?: string;
  medicalReportExamCode?: string;
  isExternal?: boolean;
}
