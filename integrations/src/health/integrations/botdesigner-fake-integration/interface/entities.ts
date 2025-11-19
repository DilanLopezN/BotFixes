export interface FakeEntity {
  code: string;
  name: string;
  friendlyName?: string;
  active?: boolean;
  canSchedule?: boolean;
  canView?: boolean;
}

export interface FakeSpeciality extends FakeEntity {
  specialityType?: string;
}

export interface FakeProcedure extends FakeEntity {
  specialityCode?: string;
  specialityType?: string;
}

export interface FakeInsurance extends FakeEntity {
  planCodes?: string[];
}

export interface FakeSchedule {
  scheduleCode: string;
  scheduleDate: string;
  duration: number;
  doctorCode: string;
  organizationUnitCode: string;
  specialityCode: string;
  insuranceCode: string;
  procedureCode?: string;
  appointmentTypeCode: string;
  status: string;
}

export interface ScheduledAppointment {
  scheduleCode: string;
  patientCode: string;
  doctorCode: string;
  scheduleDate: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  createdAt: Date;
  procedureCode?: string;
  specialityCode?: string;
  insuranceCode?: string;
  organizationUnitCode?: string;
  appointmentTypeCode?: string;
  typeOfServiceCode?: string;
  insurancePlanCode?: string;
  insuranceCategoryCode?: string;
  insuranceSubPlanCode?: string;
  patientInsuranceNumber?: string;
  patientHeight?: number;
  patientWeight?: number;
  occupationAreaCode?: string;
  data?: {
    endereco?: string;
  };
}

export interface FakePatientData {
  code?: string;
  name?: string;
  cpf?: string;
  bornDate?: string;
  email?: string;
  sex?: string;
  phone?: string;
  cellPhone?: string;
  motherName?: string;
  skinColor?: string;
  height?: number;
  weight?: number;
}

export interface FakePatientFilters {
  params: {
    cpf?: string;
    code?: string;
  };
}

export interface CreateScheduleResponse {
  scheduleCode: string;
  ok: boolean;
}

export interface CreatePatientResponse {
  patientCode?: string;
  ok: boolean;
  error?: string;
}

export interface ScheduleFilters {
  insurance?: { code: string };
  doctor?: { code: string };
  speciality?: { code: string };
  organizationUnit?: { code: string };
  procedure?: { code: string };
  appointmentType?: { code: string };
}

export interface PatientScheduleFilters {
  params: {
    code: string;
    startDate?: string;
  };
}

export interface CreateSchedulePayload {
  data: {
    scheduleCode: string;
    patientCode: string;
    doctorCode?: string;
    duration: number;
    scheduleDate: string;
    insuranceCode: string;
    organizationUnitCode?: string;
    specialityCode?: string;
    appointmentTypeCode?: string;
    procedureCode?: string;
    classificationCode?: string;
    insurancePlanCode?: string;
    insuranceCategoryCode?: string;
    insuranceSubPlanCode?: string;
    typeOfServiceCode?: string;
    patientInsuranceNumber?: string;
    patientHeight?: number;
    patientWeight?: number;
    data?: Record<string, any>;
  };
}
