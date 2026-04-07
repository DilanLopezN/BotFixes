// =============================================
// Phillips Integration - Interfaces
// Collection v3 (A1-A10, B.01-B.03) + levantamentoAPIS_Phillips_v2.txt
// Escopo: Confirmação de consultas + exames + agendamento
// =============================================

// ========== CREDENTIALS ==========

export interface PhillipsCredentialsResponse {
  apiUrl: string;
  apiToken: string;
}

// ========== COMMON ==========

export type PhillipsParamsType = { [key: string]: string | number | boolean };

export interface PhillipsPaginationParams {
  page?: number;
  maxResults?: number;
}

export interface PhillipsGenericResponse {
  status: string;
  message: string;
}

// ========== A1 - LIST SCHEDULES CONSULTATION ==========

export interface PhillipsListSchedulesParams extends PhillipsPaginationParams {
  initialDate: string;
  endDate: string;
  naturalPersonCode?: string;
}

export interface PhillipsSchedulePatient {
  naturalPersonCode: string;
  name: string;
  birthDate: string;
  taxPayerId: string;
  civilId?: string;
  medicalRecord?: number;
  gender: string;
  phoneNumber?: string;
}

export interface PhillipsScheduleSpecialty {
  code: number;
  specialty: string;
  activeStatus: string;
}

export interface PhillipsSchedulePhysician {
  naturalPersonCode: string;
  naturalPerson?: {
    naturalPersonCode: string;
    name: string;
    gender: string;
  };
  mdLicenseNumber?: string;
  regionLicenseNumber?: string;
  shortName: string;
  status: string;
}

export interface PhillipsScheduleProfessional {
  naturalPersonCode: string;
  name: string;
  gender?: string;
  phoneNumber?: string;
}

export interface PhillipsScheduleEstablishment {
  id: number;
  commercialName: string;
  status: string;
  companyId: number;
}

export interface PhillipsScheduleDepartment {
  departmentCode: number;
  consultationDepartment: string;
  room?: string;
  status: string;
}

export interface PhillipsScheduleCode {
  scheduleCode: number;
  scheduleDescription: string;
  activeStatus: string;
  establishmentCode: PhillipsScheduleEstablishment;
  typeOfSchedule: string;
  exclusiveDepartment?: PhillipsScheduleDepartment;
  specialty: PhillipsScheduleSpecialty;
  professional: PhillipsScheduleProfessional;
  physician: PhillipsSchedulePhysician;
}

export interface PhillipsScheduleEmbeddedDate {
  scheduleDate: string;
  waitingDate?: string;
  arrival?: string;
  schedulingDate: string;
  birthDate: string;
}

export interface PhillipsConsultationSchedule {
  sequence: number;
  consultationScheduleEmbeddedDate: PhillipsScheduleEmbeddedDate;
  scheduleCode: PhillipsScheduleCode;
  scheduleCod: number;
  status: string;
  scheduleStatusCode: string;
  patient: PhillipsSchedulePatient;
  department?: PhillipsScheduleDepartment;
  patientName: string;
  durationMinutes: number;
  sequenceHour: number;
  scheduleClassification: string;
  comments?: string;
  age: number;
  phoneNumber: string;
  shift: string;
  email?: string;
  authorizationCode?: string;
  fitting: boolean;
}

export interface PhillipsListSchedulesResponse {
  results: PhillipsConsultationSchedule[];
  totalElements?: number;
}

// ========== A2 - NATURAL PERSON (PATIENT) ==========

export interface PhillipsGetPatientParams {
  code: string;
  taxpayerId?: string;
  civilId?: string;
  medicalRecord?: string;
  name?: string;
  birthDate?: string;
  healthInsuranceCardCode?: string;
}

export interface PhillipsNaturalPerson {
  naturalPersonCode: string;
  personName?: string;
  name: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  birthDate: string;
  taxpayerId: string;
  civilId?: string;
  medicalRecord?: number;
  gender: string;
  maritalStatus?: string;
  mobilePhone?: string;
  internationalCallingCodeMP?: string;
  areaCodeMobilePhone?: string;
  personType: string;
  establishment?: PhillipsScheduleEstablishment;
  socialName?: string;
  definitive?: boolean | string;
  isEmployee?: string;
  healthInsurancePerson?: any[];
}

// ========== CREATE PATIENT ==========

export interface PhillipsCreatePatientPayload {
  name: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  birthDate: string;
  taxpayerId: string;
  gender: string;
  establishmentId: number;
  personType?: string;
  civilId?: string;
  medicalRecord?: string;
  mobilePhone?: string;
  internationalCallingCodeMP?: string;
  areaCodeMobilePhone?: string;
  definitive?: string;
}

export interface PhillipsCreatePatientResponse extends PhillipsGenericResponse {
  code: string;
}

// ========== A3 - ESTABLISHMENTS ==========

export interface PhillipsEstablishment {
  id: number;
  commercialName: string;
  status: string;
  companyId: number;
  legal?: {
    id: string;
    corporateName: string;
    commercialName: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phoneNumber?: string;
    areaCode?: string;
    cnes?: string;
  };
}

// ========== A4 - MEDICAL SPECIALTIES ==========
// v3: URL mudou para /api/medicalSpecialties/actives (sem hífen)
// Filtro por código: substituir /actives pelo código na URI

export interface PhillipsSpecialtyParams {
  scheduleCode?: string;
  schedulePhysicianCode?: string;
  medicalSpecialtyCode?: number; // quando informado, busca específica por código
}

export interface PhillipsMedicalSpecialty {
  code: number;
  specialty: string;
  activeStatus: string;
}

// ========== A5 - INSURANCES ==========
// v3: rota principal agora é /api/insurances/insuranceCode?insuranceCode=X

export interface PhillipsInsuranceParams {
  insuranceCode?: number;
  establishmentCode?: number;
  page?: number;
  maxResults?: number;
  dtStartPeriod?: string;
  dtEndPeriod?: string;
}

export interface PhillipsInsurancePlan {
  insurancePlanCode: string;
  planCode?: string;
  planDescription?: string;
  status?: string;
  eps?: boolean;
  externalCode?: string;
}

export interface PhillipsInsuranceCategory {
  category: string;
  categoryDescription: string;
  status: string;
}

export interface PhillipsInsurance {
  insuranceCode: number;
  insuranceDescription: string;
  typeOfInsurance: string;
  active: string;
  webSchedule?: boolean; // true = habilitado para agendamento web
  inclusionDate?: string;
  day?: number;
  referenceDate?: string;
  insurancePlanEntity?: PhillipsInsurancePlan[];
  insuranceCategoryEntity?: PhillipsInsuranceCategory[];
}

// ========== A6 - ACTIVE PHYSICIANS ==========

export interface PhillipsActivePhysician {
  physicianCode: number;
  physicianName: string;
  physicianIsActive: string;
  physicianIsOpenSchedule: boolean;
}

// ========== A7 - STATUS CONSULTATION (CONFIRM / CANCEL) ==========

export interface PhillipsUpdateConsultationStatusPayload {
  confirmationStatusIntegration: string;
  status: string; // CONFIRMED | CANCELLED | REVERT_CONFIRMATION
  reasonStatusChange: string;
}

export type PhillipsUpdateConsultationStatusResponse = PhillipsGenericResponse;

// ========== A8 - LIST EXAMS SCHEDULE ==========

export interface PhillipsListExamsScheduleParams extends PhillipsPaginationParams {
  initialDate: string;
  endDate: string;
  establishmentCode?: number;
}

export interface PhillipsExamAdditionalProcedure {
  procedureId: number;
  authorization?: string;
  internalProcedure?: {
    internalSequence: number;
    examProcedure: string;
    typeOfProcedure: string;
    status: string;
    sideProc?: string;
  };
  amount?: number;
}

export interface PhillipsExamSchedule {
  sequence: number;
  timeSlotDate: string;
  scheduleCode: number;
  scheduleDescription: string;
  scheduleStatus: string;
  scheduleStatusDescription: string;
  patientName: string;
  naturalPersonCode: string;
  taxPayerId?: string;
  patientGender?: string;
  patientBirthDate?: string;
  age?: number;
  phoneNumber?: string;
  durationMinutes: number;
  insuranceCode?: number;
  insuranceName?: string;
  typeOfInsurance?: string;
  categoryCode?: string;
  procedureCode?: number;
  procedureDescription?: string;
  physician?: string;
  physicianName?: string;
  establishmentCode: number;
  establishmentName: string;
  anesthetistRequired?: boolean;
  note?: string;
  additionalProcedure?: PhillipsExamAdditionalProcedure[];
  additionalExam?: string;
  fitting?: boolean;
}

export interface PhillipsListExamsScheduleResponse {
  results: PhillipsExamSchedule[];
  totalElements?: number;
}

// ========== A9 - INTERNAL PROCEDURES ==========

export interface PhillipsListProceduresParams extends PhillipsPaginationParams {
  codeId?: string;
  typeOfProcedure?: string;
  procedureUtilization?: string;
}

export interface PhillipsProcedureBillingInfo {
  procedureId: {
    codeId: number;
    origin: string;
  };
  status: string;
  description: string;
}

export interface PhillipsProcedureClassification {
  numberSequence: number;
  dsClassification: string;
}

export interface PhillipsProcedure {
  internalSequence: number;
  descriptionExamProcedure: string;
  nameMedicalReport?: string;
  billingProcedure?: PhillipsProcedureBillingInfo;
  typeOfProcedure: string;
  status: string;
  usefulType?: string;
  dsClassification?: PhillipsProcedureClassification;
  sideProc?: string;
  patientOrientation?: string;
}

export interface PhillipsListProceduresResponse {
  internalProcedures: PhillipsProcedure[];
}

// ========== A10 - STATUS EXAMS (CONFIRM / CANCEL) ==========

export interface PhillipsUpdateExamStatusPayload {
  status: string; // AWAITING_CONSULTATION (confirmado) | CANCELLED
}

export type PhillipsUpdateExamStatusResponse = PhillipsGenericResponse;

// ========== B.01 - AVAILABLE SCHEDULES CONSULTATION ==========

export interface PhillipsAvailableConsultationParams {
  specialtyCode: number;
  initialDate: string;
  endDate: string;
  physicianId?: number;
}

export interface PhillipsAvailableConsultationMedicalRegistry {
  naturalPersonCode: string;
  mdLicenseNumber: string;
  regionLicenseNumber: string;
  shortName: string;
}

export interface PhillipsAvailableConsultationSlot {
  sequence: number;
  scheduleDate: string;
  durationMinutes: number;
  shift: string;
  scheduleClassification: string;
  establishmentCode: number;
  establishmentName: string;
  physician: string;
  limitrophe: boolean;
  scheduleCode: number;
  scheduleName: string;
  authorizationCode: string;
  authorizationDescription: string;
  classification: string;
  date: string;
  status: string;
  medicalRegistry: PhillipsAvailableConsultationMedicalRegistry;
}

export interface PhillipsAvailableConsultationResponse {
  results: PhillipsAvailableConsultationSlot[];
}

// ========== B.02 - CREATE SCHEDULE CONSULTATION (BOOK TIME) ==========

export interface PhillipsBookConsultationPayload {
  sequence: number;
  status: string;
  patient: {
    naturalPersonCode: string;
  };
}

export type PhillipsBookConsultationResponse = PhillipsGenericResponse;

// ========== B.03 - AVAILABLE SCHEDULES EXAMS ==========

export interface PhillipsAvailableExamsParams {
  initialDate: string;
  endDate: string;
  procedureId?: string;
  naturalPersonCode?: string;
  internalProcedure?: string;
}

export interface PhillipsAvailableExamSlot {
  scheduleCode: number;
  sequence: number;
  timeSlotDate: string;
  scheduleDate: string;
  durationMinutes: number;
  shift: string;
  establishmentCode: number;
  establishmentName: string;
  physician: string;
  limitrophe: boolean;
  internalProcedureSequence?: number;
  fitting?: boolean;
}

export interface PhillipsAvailableExamsResponse {
  results: PhillipsAvailableExamSlot[];
}
