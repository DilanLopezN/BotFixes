export interface AmigoOrganizationUnitsResponse {
  findUnidades: boolean;
  message: string;
  unidadesList: {
    id: number;
    name: string;
    prefix: string;
    address_address: string;
    address_number: string;
    address_district: string;
    address_city: string;
    address_state: string;
    address: string;
  }[];
}

export interface AmigoInsurancesResponse {
  findConvenio: boolean;
  message: string;
  conveniosList: {
    id: number;
    name: string;
  }[];
}

export interface AmigoInsuranceParamsRequest {
  user_id?: string;
  place_id?: string;
  insurance_name?: string;
}

export interface AmigoInsurancePlansResponse {
  findPlanos: boolean;
  message: string;
  planosList: {
    id: number;
    name: string;
    preview_name?: string;
  }[];
}

export interface AmigoInsurancePlansParamsRequest {
  insuranceId?: number;
  user_id?: string;
  place_id?: string;
  event_id?: string;
}

export interface AmigoDoctorsResponse {
  findMedicos: boolean;
  medicosList: {
    id: number;
    name: string;
    council_number?: string;
    council_name?: string;
    specialty?: string;
    thumb_url?: string;
  }[];
}

export interface AmigoDoctorsParamsRequest {
  event_id: string;
  place_id?: string;
  specialty?: string;
  insurance_id?: string;
}

export interface AmigoSpecialitiesResponse {
  findEspecialidades: boolean;
  specialties: string[];
}

export interface AmigoProceduresResponse {
  findEventos: boolean;
  eventsList: {
    id: number;
    name: string;
    insurance?: string;
    preview_name?: string;
    matmeds?: string;
    procedures?: string;
    comeback_days?: boolean;
  }[];
}

export interface AmigoProceduresParamsRequest {
  insurance_id: string;
  place_id: string;
}

export interface AmigoGetPatientResponse {
  patientExists: boolean;
  message: string;
  patient: {
    id: number;
    name: string;
    born: string;
    contact_cellphone: string;
    email: string;
  };
}

export interface AmigoGetPatientParamsRequest {
  cpf: string;
}

export interface AmigoPatientDefault {
  name?: string;
  born?: string;
  contact_cellphone?: string;
  email?: string;
  cpf?: string;
  cpf_responsible?: string;
  insurance_number?: string;
  insurance_id?: number;
}

export interface AmigoPatientDefaultWithId extends AmigoPatientDefault {
  id: number;
}

export interface AmigoCreatePatientResponse {
  message: string;
  patient: AmigoPatientDefaultWithId;
}

export interface AmigoListAvailableSchedulerResponse {
  calendarFound: boolean;
  dates:
    | {
        [key: string]: {
          start: string;
          user_id: number;
          doctor_name: string;
          doctor_thumb_url: string;
        }[];
      }
    | {};
}

export interface AmigoListAvailableSchedulerParamsRequest {
  event_id: string;
  place_id: string;
  insurance_id?: string;
  specialty?: string;
}

export interface AmigoListAvailableSchedulerByDoctorResponse {
  DatasList:
    | {
        id: string;
        label: string;
        start_date: string;
        end_date: string;
        place_id: number;
        user_id: number;
        timegrid_id: number;
        interval: number;
        day_of_week: number;
        hour: string;
      }[]
    | string[];
  message: string;
  findHorarios: boolean;
}

export interface AmigoListAvailableSchedulerByDoctorParamsRequest {
  userId: string;
  event_id: string;
  insurance_id?: string;
  place_id?: string;
  date?: string;
}

export interface AmigoCreateScheduleParamsRequest {
  insurance_id: number;
  event_id: number;
  place_id: number;
  user_id: number;
  start_date: string;
  patient_id: number;
  patient?: {
    name: string;
    born: string;
    contact_cellphone: string;
    email: string;
  };
}

export interface AmigoCreateScheduleResponse {
  consultaAgendada: boolean;
  message?: string;
}

export interface AmigoStatusScheduleResponse {
  status: string;
  data: boolean;
}

export interface AmigoStatusScheduleParamsRequest {
  status: string;
  patient_id: string;
  attendance_id: string;
}

export interface AmigoPatientScheduleParamsRequest {
  patient_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface AmigoPatientScheduleResponse {
  status: string;
  data: {
    id: number;
    start_date: string;
    end_date: string;
    confirmed_at: string;
    canceled: boolean;
    arrived: boolean;
    missed: boolean;
    in_attendance: boolean;
    patient_id: number;
    event_id: number;
    observation: string;
    user: {
      id: number;
      name: string;
    };
    patient: {
      id: number;
      name: string;
      cpf: string;
      born: string;
      contact_cellphone: string;
    };
    place: {
      id: number;
      name: string;
      prefix: string;
    };
    agenda_event: {
      id: number;
      name: string;
    };
    new_finances: {
      id: number;
      insurance_id: number;
      health_insurance: {
        id: number;
        name: string;
        preview_name: string;
      };
    }[];
    insurance_id: number;
    payment_method: string;
    status: string;
  }[];
}
export interface AmigoConfirmOrCancelScheduleParamsRequest {
  status: string;
  patient_id: string;
  attendance_id: string;
}

export interface AmigoConfirmOrCancelScheduleResponse {
  status: string;
  data: boolean;
}

export interface AmigoListSchedulesParamsRequest {
  start_date?: number;
  end_date?: string;
  patient_id?: number;
}

interface CodeAndName {
  code: number;
  name: string;
}

interface AmigoDoctor extends CodeAndName {
  file: {
    thumb_url: string;
  };
  config_arrival_order: boolean;
}

interface AmigoPatient extends CodeAndName {
  cpf: string;
  born: string;
  contact_cellphone: string;
  contact_cellphone_dial_code: string;
  contact_cellphone_country_code: string;
}

interface AmigoOrganizationUnit extends CodeAndName {
  prefix: string;
}

interface AmigoProcedure extends CodeAndName {}

export interface AmigoSchedule {
  id: number;
  start_date: string;
  end_date: string;
  confirmed_at: string;
  canceled: boolean;
  arrived: boolean;
  missed: boolean;
  in_attendance: boolean;
  patient_id: number;
  event_id: number;
  observation: string;
  payment_method: string;
  status: string;
  insurance_id: number;
  user: AmigoDoctor;
  patient: AmigoPatient;
  place: AmigoOrganizationUnit;
  agenda_event: AmigoProcedure;
}

export type AmigoListSchedulesParamsResponse = AmigoSchedule[];
