import { TypeOfService } from '../../entities/schema';

interface Schedule {
  duration: string;
  appointmentDate: string;
  code: string;
  data?: any;
}

interface Doctor {
  code: string;
}

interface ITypeOfService {
  code: string;
}

interface OrganizationUnit {
  code: string;
}

interface AppointmentType {
  code: string;
}

interface Speciality {
  code: string;
  specialityType?: string;
}

interface Procedure {
  specialityCode: string;
  specialityType: string;
  code: string;
  data?: any;
}

interface Insurance {
  planCode: string;
  subPlanCode?: string;
  code: string;
  planCategoryCode?: string;
}

export interface CreateSchedulePatient {
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

export interface CreateSchedule {
  patient: CreateSchedulePatient;
  appointment: Schedule;
  insurance: Insurance;
  organizationUnit?: OrganizationUnit;
  procedure?: Procedure;
  speciality?: Speciality;
  doctor?: Doctor;
  typeOfService?: ITypeOfService;
  appointmentType?: AppointmentType;
  scheduleType?: TypeOfService;
  data?: Record<string, any>;
}
