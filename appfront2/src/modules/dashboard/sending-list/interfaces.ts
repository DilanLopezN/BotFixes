import { SendingType } from '~/constants/sending-type';
import { feedbackEnum } from './components/filters-modal/constants';

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
  feedback?: feedbackEnum;
};
