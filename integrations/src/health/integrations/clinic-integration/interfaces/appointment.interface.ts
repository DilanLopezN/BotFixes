import { ClinicScheduleType } from './clinic-schedule-type.enum';

interface ClinicConfirmSchedule {
  scheduleCode: string;
}

interface ClinicCancelSchedule {
  scheduleCode: string;
}

interface ClinicListAvailableScheduleParams {
  start_date: string;
  end_date: string;
}

interface ClinicListAvailableScheduleData {
  facility_id: number;
  address_id: number;
  doctor_id: string;
}

interface ClinicCreateSchedulePayload {
  address_service_id: number;
  external_id: string | number;
  patient_id: number;
  obs: string;
  healthInsuranceCode: number;
}

interface ClinicCreateScheduleData {
  facility_id: number;
  address_id: number;
  doctor_id: string;
  slot_start: string;
}

type ClinicAvailableSchedule = string;

interface ClinicCreateScheduleResponse {
  id: number;
  status: string;
  start_at: string;
  end_at: string;
}

interface ClinicListSchedulesParams {
  start_date: string;
  end_date: string;
  patient_id?: string;
}

interface ClinicSchedule {
  id: number;
  doctor: string;
  doctor_id: number;
  client: string;
  mobile: string;
  obs: string;
  origin: string;
  date_schedule: string;
  hour_schedule: string;
  healthInsuranceID: number;
  healthInsurance: string;
  status: 'Paciente desmarcou' | 'Paciente não chegou' | 'Paciente faltou' | string;
  confirm: 'A Confirmar' | string;
  record: number;
  patient_id: number;
  cpf: number;
  birthday: string;
  consultationType?: number;
  consultationTypeDescription?: string;
  type?: string;
  typeDescription?: ClinicScheduleType;
}

export {
  ClinicConfirmSchedule,
  ClinicCancelSchedule,
  ClinicAvailableSchedule,
  ClinicListAvailableScheduleParams,
  ClinicListAvailableScheduleData,
  ClinicCreateScheduleData,
  ClinicCreateSchedulePayload,
  ClinicCreateScheduleResponse,
  ClinicListSchedulesParams,
  ClinicSchedule,
};
