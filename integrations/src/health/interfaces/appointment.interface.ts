import {
  AppointmentTypeEntityDocument,
  DoctorEntityDocument,
  InsuranceEntityDocument,
  InsurancePlanEntityDocument,
  InsuranceSubPlanEntityDocument,
  OccupationAreaEntityDocument,
  OrganizationUnitEntityDocument,
  OrganizationUnitLocationEntityDocument,
  ProcedureEntityDocument,
  PlanCategoryEntityDocument,
  SpecialityEntityDocument,
  TypeOfServiceEntityDocument,
} from '../entities/schema';
import { FlowAction } from '../flow/interfaces/flow.interface';

enum AppointmentStatus {
  canceled = 0,
  scheduled = 1,
  confirmed = 2,
  finished = 3,
}

interface Appointment {
  appointmentCode: string;
  canConfirm?: boolean;
  canCancel?: boolean;
  canReschedule?: boolean;
  duration?: string;
  appointmentDate: string;
  status: AppointmentStatus;
  doctor?: DoctorEntityDocument;
  procedure?: ProcedureEntityDocument;
  organizationUnit?: OrganizationUnitEntityDocument;
  insurance?: InsuranceEntityDocument;
  speciality?: SpecialityEntityDocument;
  insurancePlan?: InsurancePlanEntityDocument;
  insuranceSubPlan?: InsuranceSubPlanEntityDocument;
  planCategory?: PlanCategoryEntityDocument;
  appointmentType?: AppointmentTypeEntityDocument;
  occupationArea?: OccupationAreaEntityDocument;
  organizationUnitLocation?: OrganizationUnitLocationEntityDocument;
  typeOfService?: TypeOfServiceEntityDocument;
  data?: any;
  actions?: FlowAction[];
  // orientação que será exibida após agendamento
  guidance?: string;
  guidanceLink?: string;
  // observação que será exibida após agendamento
  observation?: string;
  // possíveis avisos que serão exibidos para o paciente antes do agendamento
  warning?: string;
  isFollowUp?: boolean;
  price?: AppointmentValue;
  organizationUnitAdress?: string;
}

interface AppointmentValue {
  currency: string;
  value: string;
  observation?: string;
}

interface MinifiedAppointments {
  lastAppointment: Appointment;
  nextAppointment: Appointment;
  appointmentList: {
    appointmentDate: string;
    appointmentCode: string;
    appointmentType?: string;
    actions?: FlowAction[];
  }[];
}

interface FollowUpAppointment {
  appointmentDate: string;
  doctor?: DoctorEntityDocument;
  procedure?: ProcedureEntityDocument;
  organizationUnit?: OrganizationUnitEntityDocument;
  insurance?: InsuranceEntityDocument;
  speciality?: SpecialityEntityDocument;
  insurancePlan?: InsurancePlanEntityDocument;
  insuranceSubPlan?: InsuranceSubPlanEntityDocument;
  planCategory?: PlanCategoryEntityDocument;
  appointmentType?: AppointmentTypeEntityDocument;
  followUpLimit: string;
  inFollowUpPeriod: boolean;
  typeOfServiceFollowUp?: TypeOfServiceEntityDocument;
  typeOfService?: TypeOfServiceEntityDocument;
}

enum AppointmentSortMethod {
  firstEachPeriodDay = 'firstEachPeriodDay',
  firstEachAnyPeriodDay = 'firstEachAnyPeriodDay',
  firstEachHourDay = 'firstEachHourDay',
  default = 'default',
  combineDatePeriodByOrganization = 'combineDatePeriodByOrganization',
  // retorna sem nenhuma manipulação, os primeiros disponíveis
  sequential = 'sequential',
  // balanceia primeiros horários entre médicos usando fila de prioridade
  firstEachDoctorBalanced = 'firstEachDoctorBalanced',
}

export {
  AppointmentSortMethod,
  Appointment,
  MinifiedAppointments,
  AppointmentValue,
  AppointmentStatus,
  FollowUpAppointment,
};
