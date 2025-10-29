import { SendingType } from '~/constants/sending-type';
import { RecipientTypeEnum, FeedbackEnum } from '~/modules/dashboard/sending-list/constants';
import { SendingStatus } from '~/services/workspace/get-sending-list-by-workspace-id';

export interface SendingListQueryParams {
  workspaceId?: string;
  startDate: string;
  endDate: string;
  type?: SendingType;
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
  feedback?: FeedbackEnum;
  recipientType?: RecipientTypeEnum;
  getGroup: boolean;
  aliasSettingId?: string;
}
