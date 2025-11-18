import { Schedules } from '../../schedules/entities/schedules.entity';

export interface ConfirmationScheduleGuidance {
  scheduleCodes?: string[];
  scheduleIds?: number[];
}

interface ExtendedSchedules extends Schedules {
  guidanceLink?: string;
}

export type ConfirmationScheduleGuidanceResponse = Pick<
  ExtendedSchedules,
  | 'scheduleCode'
  | 'guidance'
  | 'appointmentTypeName'
  | 'doctorName'
  | 'insuranceCategoryName'
  | 'insuranceName'
  | 'organizationUnitAddress'
  | 'patientName'
  | 'procedureName'
  | 'procedureCode'
  | 'specialityName'
  | 'specialityCode'
  | 'typeOfServiceName'
  | 'organizationUnitName'
  | 'guidanceLink'
>[];
