interface ClinicInsuranceResponse {
  id: number;
  name: string;
}

interface ClinicOrganizationUnitResponse {
  id: number;
  name: string;
}

interface ClinicOrganizationUnitAddressResponse {
  id: number;
  name: string;
  address: string;
}

interface ClinicDoctorParamsRequest {
  birthday?: string;
  specialty_cbo?: string;
  health_insurance_id?: string;
  filter_web_disabled?: number;
}

interface ClinicDoctorResponse {
  id: number;
  crm: number;
  nin: string;
  name: string;
  email: string;
  medicalAppointmentWEB?: 'true' | 'false';
}

interface ClinicSpecialitiesParamsRequest {
  birthday?: string;
  health_insurance_id?: string;
}

interface ClinicSpecialitiesResponse {
  id: number;
  cbo: string;
  name: string;
}

interface ClinicDoctorSpecialityDataRequest {
  doctorCode: string;
}

interface ClinicDoctorSpecialityResponse {
  id: number;
  enabled: true;
  name: string;
  specialty_id: number;
  specialty: string;
  rules?: {
    minimumAge: number;
    maximumAge: number;
  };
}

interface ClinicProceduresParamsRequest {
  health_insurance_id: number;
}

interface ClinicConsultationTypesResponse {
  id: number;
  tbCodigo?: number;
  description: string;
}

export {
  ClinicInsuranceResponse,
  ClinicOrganizationUnitResponse,
  ClinicDoctorResponse,
  ClinicDoctorParamsRequest,
  ClinicSpecialitiesParamsRequest,
  ClinicSpecialitiesResponse,
  ClinicDoctorSpecialityResponse,
  ClinicDoctorSpecialityDataRequest,
  ClinicOrganizationUnitAddressResponse,
  ClinicProceduresParamsRequest,
  ClinicConsultationTypesResponse,
};
