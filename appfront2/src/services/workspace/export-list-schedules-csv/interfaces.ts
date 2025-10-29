import { ExportType } from '~/components/export-button';
import { FeedbackEnum } from '~/modules/dashboard/sending-list/constants';
import { ExportableFields } from './exportable-fields.enum';

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
  feedback?: FeedbackEnum;
}

export interface ExportListSchedulesCsvParams {
  workspaceId: string | undefined;
  filter: ScheduleFilterListDto;
  downloadType: ExportType;
  selectedColumns?: ExportableFields[];
}
