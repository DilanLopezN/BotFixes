import { ConfirmationScheduleDataEmail } from './confirmation-schedule-data-email.interface';

export enum ListingType {
  All = 'all',
  Scheduled = 'scheduled',
}

export interface ListSchedules {
  patientErpCode: string;
  shortId: string;
  scheduleCode?: string;
  listingType?: ListingType;
  data?: ConfirmationScheduleDataEmail;
}
