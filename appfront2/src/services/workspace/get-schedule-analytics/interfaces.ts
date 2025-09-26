import { SendingType } from '~/constants/sending-type';
import { SendingStatus } from '../get-sending-list-by-workspace-id';
import { feedbackEnum } from '~/modules/dashboard/sending-list/components/filters-modal/constants';

export interface GetScheduleAnalyticsByWorkspaceIdParams {
  workspaceId: string;
  startDate: string;
  endDate: string;
  resultType?: SendingType;
  search?: string;
  specialityCodeList?: string[];
  doctorCodeList?: string[];
  statusList?: SendingStatus[];
  procedureCodeList?: string[];
  cancelReasonList?: string[];
  organizationUnitList?: string[];
  insuranceCodeList?: string[];
  insurancePlanCodeList?: string[];
  npsScoreList?: string[];
  feedback?: feedbackEnum;
}

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
