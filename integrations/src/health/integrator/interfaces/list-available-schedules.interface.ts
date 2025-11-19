import { TypeOfService } from '../../entities/schema';
import { FlowPeriodOfDay, FlowType } from '../../flow/interfaces/flow.interface';
import { Appointment, AppointmentSortMethod } from '../../interfaces/appointment.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export interface AvailableSchedulesPeriod {
  start: string;
  end: string;
}

export interface AvailableSchedulesPeriodPatient {
  code?: string;
  bornDate: string;
  cpf?: string;
  sex?: string;
  weight?: number;
  height?: number;
  name?: string;
  phone?: string;
}

export interface ListAvailableSchedulesResponse {
  metadata?: AvailableSchedulesMetadata;
  schedules: Appointment[];
}

export interface ListAvailableSchedules {
  limit: number;
  fromDay: number;
  untilDay: number;
  randomize: boolean;
  period?: AvailableSchedulesPeriod;
  sortMethod?: AppointmentSortMethod;
  patient?: AvailableSchedulesPeriodPatient;
  filter: CorrelationFilter;
  periodOfDay?: FlowPeriodOfDay;
  dateLimit?: number;
  appointmentCodeToCancel?: string;
  scheduleType?: TypeOfService;
  isSuggestionRequest?: boolean; // flag utilizada para evitar filtragem de regras de agendamento
}

export interface AvailableSchedulesMetadata {
  interAppointmentPeriod?: number;
  runInterAppointment?: boolean;
  numberOfSchedulesLessThanLimit?: boolean;
  doNotAllowSameDayScheduling?: boolean;
  doNotAllowSameDayAndDoctorScheduling?: boolean;
  doNotAllowSameDayAndProcedureScheduling?: boolean;
  executedFlows?: { [flowId: string]: FlowType };
}
