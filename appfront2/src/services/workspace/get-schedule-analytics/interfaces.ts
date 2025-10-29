import { SendingType } from '~/constants/sending-type';
import { SendingListQueryParams } from '~/interfaces/send-list-query-params';

export interface GetScheduleAnalyticsByWorkspaceIdParams extends SendingListQueryParams {}

export interface ScheduleAnalytics {
  [SendingType.confirmation]?: {
    total: number;
    notAnswered: number;
    confirmed: number;
    canceled: number;
    invalidNumber: number;
    reschedule: number;
    open_cvs: number;
  };
  [SendingType.reminder]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
  };
  [SendingType.nps]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
  };
  [SendingType.medical_report]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
  };
  [SendingType.schedule_notification]?: {
    invalidNumber: number;
    notAnswered: number;
    open_cvs: number;
    total: number;
  };
  [SendingType.documents_request]?: {
    invalidNumber: number;
    notAnswered: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
    document_uploaded: number;
    total: number;
  };
  [SendingType.nps_score]?: {
    invalidNumber: number;
    notAnswered: number;
    open_cvs: number;
    total: number;
  };
  [SendingType.recover_lost_schedule]?: {
    invalidNumber: number;
    notAnswered: number;
    open_cvs: number;
    total: number;
  };
}
