import { SendingType } from '~/constants/sending-type';
import { SendingStatus } from '../get-sending-list-by-workspace-id';
import { feedbackEnum } from '~/modules/dashboard/sending-list/components/filters-modal/constants';

export interface GetCancelingReasonMetricsProps {
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
