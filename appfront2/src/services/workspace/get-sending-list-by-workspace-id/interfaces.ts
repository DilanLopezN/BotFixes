import { SendingType } from '~/constants/sending-type';
import { SendingStatus } from './constants';
import { feedbackEnum } from '~/modules/dashboard/sending-list/components/filters-modal/constants';

export interface GetSendingListByWorkspaceIdParams {
  workspaceId: string;
  startDate: string;
  endDate: string;
  type?: string;
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

export interface SendingListData {
  conversationId: string;
  sendType: SendingType;
  status: SendingStatus | null;
  patientCode: string;
  id: number;
  groupIdList?: string;
  groupCount?: string;
  scheduleSettingId: string;
  extractResumeId: string;
  workspaceId: string;
  integrationId: string;
  groupId: string;
  groupCodeList: string;
  groupDescription: string;
  organizationUnitAddress: string | null;
  organizationUnitName: string | null;
  organizationUnitCode: string | null;
  procedureName: string | null;
  specialityName: string | null;
  procedureCode: string | null;
  doctorObservation: string | null;
  doctorName: string | null;
  doctorCode: string | null;
  appointmentTypeName: string | null;
  appointmentTypeCode: string | null;
  scheduleCode: string;
  principalScheduleCode: string | null;
  isPrincipal: boolean;
  scheduleDate: string;
  patientPhone: string | null;
  patientEmail: string | null;
  patientName: string | null;
  createdAt: string;
  specialityCode: string | null;
  scheduleId?: string;
  data: Record<string, any>;
  reasonId?: string | null;
  isFirstComeFirstServed: boolean | null;
}

export interface SendingList {
  count: number;
  data: SendingListData[];
  currentPage: number;
  nextPage: number;
}
