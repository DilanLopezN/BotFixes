interface DrMobileInsurancesResponse {
  codigo_convenio: number;
  nome_convenio: string;
  sn_ativo: string;
  tipo_convenio: string;
}

interface DrMobileDoctorsParamsRequest {
  specialityCode: string;
}

interface DrMobileDoctorsByUnitParamsRequest {
  specialityCode: string;
  organizationUnitCode: string;
}

interface DrMobileResourceDoctorDetailsParamsRequest {}

interface DrMobileSpecialitiesResponse {
  data: DrMobileSpeciality[];
}

interface DrMobileSpeciality {
  codigo_servico: number;
  descricao_servico: string;
  codigo_especialidade: number;
}

interface DrMobileProceduresParamsRequest {
  specialityCode: string;
}

interface DrMobileProceduresResponse {
  codigo_item: number;
  descricao_item: string;
  tipo_item: string;
  codigo_exame_imagem: string;
}

interface DrMobileSpecialitiesExamsResponse {}

interface DrMobileAppointmentTypeResponse {}

interface DrMobileInsurancePlansResponse {
  codigo_plano: number;
  descricao_plano: string;
}

interface DrMobileInsuranceSubPlansResponse {
  codigo_sub_plano: number;
  descricao_sub_plano: string;
}

interface DrMobileInsurancePlansParamsRequest {
  insuranceCode: string;
}

interface DrMobileOrganizationUnitsParamsRequest {
  specialityCode: string;
}

interface DrMobileInsuranceSubPlansParamsRequest {
  insuranceCode: string;
  insuranePlanCode: string;
}

interface DrMobileOrganizationUnitsResponse {
  unidades: DrMobileOrganizationUnit[];
}

interface DrMobileOrganizationUnit {
  cd_unidade_atendimento: number;
  ds_unidade_atendimento: string;
  ds_sigla_agendamento: string;
  nr_cep: string;
  ds_endereco: string;
  nr_endereco: string;
  ds_complemento: string;
  nm_bairro: string;
  nm_cidade: string;
  ds_local_unidade_atendimento: string;
  sn_ativo: string;
}

interface DrMobileDoctor {
  cdPrestador: number;
  nmPrestador: string;
  especialidades: {
    cdEspecialidade: number;
    dsEspecialidade: string;
    serDisList: {
      codigo_servico: number;
      descricao_servico: string;
      codigo_especialidade: number;
    }[];
  }[];
}

interface DrMobileDoctorsByUnitParamsRequest {
  specialityCode: string;
  organizationUnitCode: string;
  insuranceCode: string;
}

export {
  DrMobileInsurancesResponse,
  DrMobileSpecialitiesResponse,
  DrMobileProceduresResponse,
  DrMobileAppointmentTypeResponse,
  DrMobileOrganizationUnitsResponse,
  DrMobileDoctor,
  DrMobileInsurancePlansResponse,
  DrMobileInsurancePlansParamsRequest,
  DrMobileDoctorsParamsRequest,
  DrMobileResourceDoctorDetailsParamsRequest,
  DrMobileSpecialitiesExamsResponse,
  DrMobileInsuranceSubPlansParamsRequest,
  DrMobileInsuranceSubPlansResponse,
  DrMobileOrganizationUnitsParamsRequest,
  DrMobileSpeciality,
  DrMobileOrganizationUnit,
  DrMobileDoctorsByUnitParamsRequest,
  DrMobileProceduresParamsRequest,
};
