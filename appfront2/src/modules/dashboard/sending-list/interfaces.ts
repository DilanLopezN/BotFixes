import { SendingType } from '~/constants/sending-type';
import { RecipientTypeEnum, FeedbackEnum } from './constants';

export type SendingListQueryString = {
  startDate: string;
  endDate: string;
  type?: SendingType;
  search?: string;
  currentPage?: string;
  pageSize?: string;
  specialityCodeList?: string;
  doctorCodeList?: string;
  statusList?: string;
  showAlert?: string;
  procedureCodeList?: string;
  cancelReasonList?: string;
  organizationUnitList?: string;
  insuranceCodeList?: string;
  insurancePlanCodeList?: string;
  npsScoreList?: string;
  getGroup?: string;
  feedback?: FeedbackEnum;
  recipientType?: RecipientTypeEnum;
  aliasSettingId?: string;
};
