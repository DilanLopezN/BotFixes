export interface ListSchedulesToConfirm {
  startDate: number;
  endDate: number;
  contactCode: string;
  offset: number;
  limit: number;
  buildShortLink?: boolean;
}

export interface ListSchedulesToConfirmV2<T = {}> {
  startDate: string;
  endDate: string;
  scheduleCode?: string;
  page: number;
  erpParams?: T & DefaultListConfirmationErpParams;
  maxResults: number;
  buildShortLink?: boolean;
}

export interface DefaultListConfirmationErpParams {
  debugLimit?: number;
  debugPhoneNumber?: number;
  debugEmail?: string;
  debugPatientCode?: string[];
  debugScheduleCode?: string[];
  EXTRACT_TYPE?: ExtractType;
}

export enum ExtractType {
  confirmation = 'confirmation',
  reminder = 'reminder',
  nps = 'nps',
  medical_report = 'medical_report',
  schedule_notification = 'schedule_notification',
  recover_lost_schedule = 'recover_lost_schedule',
  documents_request = 'documents_request',
}
