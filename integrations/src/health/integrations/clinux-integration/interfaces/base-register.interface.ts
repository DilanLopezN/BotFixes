interface ClinuxOrganizationsParamsRequest {}

interface ClinuxOrganizationsResponse {
  cd_empresa: number;
  cd_plano_particular: number;
  ds_empresa: string;
  ds_endereco: string;
  ds_site: string;
  ds_web: string;
  sn_matriz: boolean;
}

interface ClinuxInsurancesResponse {
  cd_fornecedor: number;
  cd_plano: number;
  ds_fornecedor: string;
  ds_plano: string;
}

interface ClinuxInsurancesParamsRequest {
  cd_empresa?: number;
  cd_procedimento?: number;
  cd_modalidade?: number;
}

interface ClinuxInsurancePlansResponse {
  cd_subplano: number;
  ds_subplano: string;
}

interface ClinuxInsurancePlansParamsRequest {
  cd_plano: number;
}

interface ClinuxDoctorsParamsRequest {
  cd_modalidade?: number;
  cd_procedimento?: number;
  cd_laudo?: number;
}

interface ClinuxDoctorsResponse {
  cd_medico: number;
  ds_medico: string;
  ds_crm_nr: string;
  ds_crm_uf: string;
  ds_sexo: string;
  ds_especialidade: string;
  cd_plano_particular: string;
}

interface ClinuxProceduresResponse {
  cd_modalidade: number;
  cd_procedimento: number;
  ds_modalidade: string;
  ds_procedimento: string;
  nr_tempo: any;
  sn_especial: boolean;
  sn_medico: boolean;
  sn_preparo: boolean;
}

interface ClinuxProceduresParamsRequest {
  cd_paciente?: number;
  cd_empresa?: number;
  cd_plano?: number;
  cd_modalidade?: number;
  sn_laudo: boolean;
}

interface ClinuxProcedureValueParamsRequest {
  cd_procedimento: number;
  cd_plano: number;
}

interface ClinuxProcedureGuidanceParamsRequest {
  cd_procedimento: number;
}

interface ClinuxProcedureValueResponse {
  nr_vl_particular: string;
}

interface ClinuxProcedureGuidanceResponse {
  cd_procedimento: number;
  bb_preparo: string;
}

interface ClinuxSpecialitiesResponse {
  cd_modalidade: number;
  ds_modalidade: string;
  ds_sigla: string;
  sn_medico: boolean;
}

interface ClinuxSpecialitiesParamsRequest {
  cd_empresa?: number;
}

interface ClinuxExternalResultRequest {
  cd_exame: number;
}

interface ClinuxExternalResultResponse {
  cd_laudo: number;
  cd_paciente: number;
  dt_data: string;
  ds_procedimento: string;
  ds_medico: string;
  ds_solicitante: string;
  sn_captura: boolean;
}

interface ClinuxExternalResultDownloadRequest {
  cd_laudo: number;
  cd_paciente: number;
  sn_captura: boolean;
}

interface ClinuxResultDownloadRequest {
  cd_exame: number;
  cd_paciente: number;
  cd_funcionario: number;
  sn_entrega: boolean;
  sn_medico: boolean;
}

export {
  ClinuxOrganizationsResponse,
  ClinuxOrganizationsParamsRequest,
  ClinuxInsurancesResponse,
  ClinuxInsurancesParamsRequest,
  ClinuxInsurancePlansParamsRequest,
  ClinuxInsurancePlansResponse,
  ClinuxProceduresResponse,
  ClinuxProceduresParamsRequest,
  ClinuxProcedureValueParamsRequest,
  ClinuxProcedureValueResponse,
  ClinuxSpecialitiesResponse,
  ClinuxSpecialitiesParamsRequest,
  ClinuxDoctorsParamsRequest,
  ClinuxDoctorsResponse,
  ClinuxProcedureGuidanceParamsRequest,
  ClinuxProcedureGuidanceResponse,
  ClinuxExternalResultRequest,
  ClinuxExternalResultResponse,
  ClinuxResultDownloadRequest,
  ClinuxExternalResultDownloadRequest,
};
