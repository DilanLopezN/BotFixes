import { FlowAction } from '../flow/interfaces/flow.interface';

interface ConfirmationSchedule {
  data: ConfirmationScheduleData[] | ConfirmationScheduleDataV2[];
  ommitedData?: ConfirmationScheduleData[] | ConfirmationScheduleDataV2[];
  metadata: ConfirmationScheduleMetadata;
}

interface ConfirmationScheduleMetadata {
  extractStartedAt: number;
  extractEndedAt: number;
  extractedCount: number;
}

interface ConfirmationScheduleData {
  contact: ConfirmationScheduleContact;
  schedules?: ConfirmationScheduleSchedule[];
  actions?: FlowAction[];
}

interface ConfirmationScheduleDataV2 {
  contact: ConfirmationScheduleContact;
  schedule?: ConfirmationScheduleSchedule;
  actions?: FlowAction[];
}

interface ConfirmationScheduleContact {
  phone: string[];
  email?: string[];
  name: string;
  code: string;
}

interface ConfirmationScheduleSchedule {
  scheduleCode: string;
  scheduleId: number;
  scheduleDate: string;
  organizationUnitAddress: string;
  organizationUnitName: string;
  procedureName: string;
  specialityName: string;
  doctorName: string;
  doctorObservation?: string;
  principalScheduleCode?: string;
  isPrincipal?: boolean;
  appointmentTypeName: string;
  appointmentTypeCode?: string;
  guidance?: string;
  observation?: string;
  doctorCode?: string;
  specialityCode?: string;
  organizationUnitCode?: string;
  procedureCode?: string;
  insuranceName?: string;
  insuranceCode?: string;
  insurancePlanName?: string;
  insurancePlanCode?: string;
  isFirstComeFirstServed?: boolean;
  data?: any;
}

export {
  ConfirmationSchedule,
  ConfirmationScheduleContact,
  ConfirmationScheduleSchedule,
  ConfirmationScheduleData,
  ConfirmationScheduleMetadata,
  ConfirmationScheduleDataV2,
};
