import { FeedbackEnum } from '~/modules/dashboard/sending-list/constants';
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
  feedback?: FeedbackEnum;
}

export enum ExportableFields {
  PATIENT_CODE = 'patientCode',
  PATIENT_NAME = 'patientName',
  DOCTOR_NAME = 'doctorName',
  DOCTOR_CODE = 'doctorCode',
  SCHEDULE_DATE = 'scheduleDate',
  STATUS = 'status',
  SEND_TYPE = 'sendType',
  PROCEDURE_NAME = 'procedureName',
  PROCEDURE_CODE = 'procedureCode',
  APPOINTMENT_TYPE_NAME = 'appointmentTypeName',
  APPOINTMENT_TYPE_CODE = 'appointmentTypeCode',
  ORGANIZATION_UNIT_NAME = 'organizationUnitName',
  ORGANIZATION_UNIT_CODE = 'organizationUnitCode',
  SPECIALITY_NAME = 'specialityName',
  SPECIALITY_CODE = 'specialityCode',
  INSURANCE_NAME = 'insuranceName',
  INSURANCE_CODE = 'insuranceCode',
  INSURANCE_PLAN_NAME = 'insurancePlanName',
  INSURANCE_PLAN_CODE = 'insurancePlanCode',
  CANCEL_REASON_NAME = 'cancelReasonName',
  RECIPIENT_TYPE = 'recipientType',
  SCHEDULE_CODE = 'scheduleCode',
  EMAIL = 'email',
  PHONE = 'phone',
  GROUP_DESCRIPTION = 'groupDescription',
  SENDED_AT = 'sendedAt',
  RESPONSE_AT = 'responseAt',
  NPS_SCORE = 'npsScore',
  NPS_SCORE_COMMENT = 'npsScoreComment',
}

export interface ExportListSchedulesCsvParams {
  workspaceId: string | undefined;
  filter: ScheduleFilterListDto;
  downloadType: TypeDownloadEnum;
  selectedColumns?: ExportableFields[];
}
