import { feedbackEnum } from '~/modules/dashboard/sending-list/components/filters-modal/constants';
import { TypeDownloadEnum } from './type-download-enum';

export interface ScheduleFilterListDto {
  startDate: string;
  endDate: string;
  status?: string;
  statusList?: string[];
  organizationUnitList?: string[];
  doctorCodeList?: string[];
  procedureCodeList?: string[];
  specialityCodeList?: string[];
  cancelReasonList?: string[];
  appointmentTypeCodeList?: string[];
  patientCode?: string;
  type?: string;
  patientName?: string;
  scheduleCode?: string;
  search?: string;
  insuranceCodeList?: string[];
  insurancePlanCodeList?: string[];
  npsScoreList?: string[];
  feedback?: feedbackEnum;
}

export interface ExportListSchedulesCsvParams {
  workspaceId: string | undefined;
  filter: ScheduleFilterListDto;
  downloadType: TypeDownloadEnum;
}
