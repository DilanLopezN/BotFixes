import { StenciIdentity } from './common.interface';

export enum StenciAppointmentStatus {
  available = 'available',
  blocked = 'blocked',
  confirmed = 'confirmed',
  finished = 'finished',
  in_attendance = 'in_attendance',
  missed = 'missed',
  canceled = 'canceled',
  payment = 'payment',
  professional_canceled = 'professional_canceled',
  report = 'report',
  rescheduled = 'rescheduled',
  scheduled = 'scheduled',
  screening = 'screening',
  unsuccessful = 'unsuccessful',
  waiting = 'waiting',
}

export interface StenciPatientInput {
  name: string;
  birthDate: string; // yyyy-mm-dd
  gender: 'male' | 'female';
  identity: StenciIdentity;
  cellphone?: string;
  email?: string;
}

export interface StenciCreateAppointmentRequest {
  scheduleId: string;
  professionalId: string;
  date: string; // yyyy-mm-dd
  hour: string; // HH:mm
  patient: StenciPatientInput;
  insurancePlanId: string;
  serviceId: string;
  notes?: string;
  origin?: string;
}

export interface StenciUpdateAppointmentRequest {
  status?: StenciAppointmentStatus;
}

export interface StenciAppointmentPatient {
  id: string;
  name: string;
  phone?: string;
  cellphone?: string;
  identity?: StenciIdentity;
  birthDate?: string;
  email?: string;
  gender?: 'male' | 'female';
}

export interface StenciAppointmentProfessional {
  id: string;
  name: string;
}

export interface StenciAppointmentSchedule {
  id: string;
  name: string;
}

export interface StenciAppointmentInsurance {
  id: string;
  name: string;
  fullName: string;
  plan: {
    id: string;
    name: string;
  };
}

export interface StenciAppointmentService {
  id: string;
  name: string;
  specialty: {
    code: string;
    name: string;
  };
}

export interface StenciAppointmentResponse {
  data: {
    items: StenciAppointment[];
    hasMore: boolean;
  };
  organizationUnitCode: string;
}

export interface StenciAppointment {
  id: string;
  startDate: string;
  endDate: string;
  status: StenciAppointmentStatus;
  patient: StenciAppointmentPatient;
  professional: StenciAppointmentProfessional;
  schedule: StenciAppointmentSchedule;
  insurance: StenciAppointmentInsurance;
  services: StenciAppointmentService[];
  notes?: string;
  origin?: string | null;
}

export interface StenciListAppointmentsParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  patientId?: string;
  professionalId?: string;
  scheduleId?: string;
  insurancePlanId?: string;
  serviceId?: string;
}

export interface StenciFreeHoursParams {
  limit?: number;
  offset?: number;
  insurancePlanId?: string;
  serviceId?: string;
  professionalIds?: string; // comma-separated
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
}

export interface StenciFreeHoursSchedule {
  id: string;
  name: string;
}

export interface StenciFreeHoursProfessional {
  id: string;
  name: string;
}

export interface StenciFreeHoursArrivalOrder {
  start: string;
  end: string;
}

export interface StenciFreeHoursResponse {
  date: string;
  schedule: StenciFreeHoursSchedule;
  professional: StenciFreeHoursProfessional;
  arrivalOrder: StenciFreeHoursArrivalOrder | null;
  hours: string[];
}

export interface StenciListSchedulesParams {
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  limit?: number;
  offset?: number;
  status?: StenciAppointmentStatus;
  patientId?: string;
  professionalId?: string;
  scheduleId?: string;
  insurancePlanId?: string;
  serviceId?: string;
}
