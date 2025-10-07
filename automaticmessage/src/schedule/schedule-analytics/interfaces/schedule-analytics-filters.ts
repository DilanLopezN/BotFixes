import { ScheduleFilterListData } from '../../interfaces/schedule-filter-list-data.interface';
import { ExtractResumeType } from '../../models/extract-resume.entity';

export interface ScheduleAnalyticsFilters extends ScheduleFilterListData {}
export interface ResultScheduleCancelReasonAnalytics {
  reasonName: string;
  count: number;
}

export interface ResultNpsScheduleAnalytics {
  nps_score: string;
  count: number;
}
export interface ResultScheduleAnalytics {
  [ExtractResumeType.confirmation]?: {
    total: number;
    notAnswered: number;
    confirmed: number;
    canceled: number;
    individual_cancel: number;
    invalidNumber: number;
    open_cvs: number;
    reschedule: number;
    no_recipient: number;
    invalid_recipient: number;
    confirm_reschedule?: number;
  };
  [ExtractResumeType.reminder]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
  };
  [ExtractResumeType.nps]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
  };
  [ExtractResumeType.medical_report]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
  };
  [ExtractResumeType.schedule_notification]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
  };
  [ExtractResumeType.recover_lost_schedule]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
    start_reschedule_recover: number;
    cancel_reschedule_recover: number;
    confirm_reschedule_recover: number;
  };
  [ExtractResumeType.nps_score]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
  };
  [ExtractResumeType.documents_request]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
    document_uploaded: number;
  };
  [ExtractResumeType.active_mkt]?: {
    total: number;
    notAnswered: number;
    invalidNumber: number;
    open_cvs: number;
    no_recipient: number;
    invalid_recipient: number;
  };
}
