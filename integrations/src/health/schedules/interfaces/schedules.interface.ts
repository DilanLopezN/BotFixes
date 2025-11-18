import { Extractions } from '../entities/extractions.entity';

enum ScheduleStatus {
  canceled = -1,
  extracted = 0,
  confirmed = 1,
}

interface ISchedules {
  integrationId: string;
  workspaceId: string;
  createdAt: number;
  updatedAt?: number;
  /** dados agendamento */
  isFirstComeFirstServed?: boolean;
  scheduleCode: string;
  scheduleDate?: number;
  scheduleStatus: ScheduleStatus;
  /** dados entidades */
  specialityName?: string;
  specialityCode?: string;
  procedureName?: string;
  procedureCode?: string;
  appointmentTypeName?: string;
  appointmentTypeCode?: string;
  insuranceName?: string;
  insuranceCode?: string;
  typeOfServiceCode?: string;
  typeOfServiceName?: string;
  insurancePlanName?: string;
  insurancePlanCode?: string;
  doctorName?: string;
  doctorCode?: string;
  insuranceCategoryName?: string;
  insuranceCategoryCode?: string;
  insuranceSubPlanName?: string;
  insuranceSubPlanCode?: string;
  organizationUnitName?: string;
  organizationUnitCode?: string;
  referenceTypeOfService?: string;
  referenceScheduleType?: string;
  organizationUnitAddress?: string;
  /** dados paciente */
  patientCode?: string;
  patientName: string;
  patientCpf?: string;
  patientBornDate?: string;
  patientPhone1?: string;
  patientPhone2?: string;
  patientEmail1?: string;
  patientEmail2?: string;
  extraction?: Extractions;
}

export { ISchedules, ScheduleStatus };
