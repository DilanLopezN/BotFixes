import { CreateSchedule } from './create-schedule.interface';

interface Patient {
  code: string;
  bornDate?: string;
  insuranceNumber?: string;
  name?: string;
  email?: string;
  sex?: string;
  identityNumber?: string;
  cellPhone?: string;
  phone?: string;
  height?: number;
  weight?: number;
  cpf?: string;
  data?: any;
}

export interface Reschedule {
  scheduleToCancelCode: string;
  scheduleToCreate: CreateSchedule;
  patient: Patient;
}
