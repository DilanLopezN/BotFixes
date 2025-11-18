export interface ConfirmationScheduleDataEmail {
  scheduleId: string;
  scheduleIds: string[];
  confirmationType: 'email';
  patientErpCode: string;
  scheduleCode: string;
  scheduleCodes: string[];
  shortId: string;
  data?: unknown;
}
