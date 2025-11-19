interface FeegowOrganizationUnitsParamsRequest {}

interface OrganizationResponse {
  unidade_id: number;
  nome_fantasia: string;
  cnpj: string;
  endereco: string;
  cep: string;
  numero: string;
  bairro: string;
  telefone_1: string;
  telefone_2: string;
  email_1: string;
  email_2: string;
  complementos: string;
}

interface FeegowOrganizationsResponse {
  matriz: OrganizationResponse[];
  unidades: OrganizationResponse[];
}

interface FeegowSpecialitiesParamsRequest {
  UnitID?: number;
}

interface FeegowSpecialitiesResponse {
  especialidade_id: number;
  nome: string;
  exibir_agendamento_online: number;
}

interface FeegowProceduresParamsRequest {
  especialidade_id?: number;
  tipo_procedimento?: number;
  unidade_id?: number;
  paciente_id?: number;
  profissional_id?: number;
  tabela_id?: number;
  procedimento_id?: number;
}

interface FeegowProceduresResponse {
  procedimento_id: number;
  nome: string;
  tipo_procedimento: number;
  opcoes_agendamento: number;
  permite_agendamento_online: boolean;
  preparo: string;
  dias_retorno: string;
  codigo: string;
  grupo_procedimento: number;
  tempo: string;
  valor: number;
  especialidade_id: number[];
}

interface FeegowInsurancesParamsRequest {
  // não existe na request, filtra em memória
  insurance_id?: number;
}

interface FeegowInsurancesResponse {
  convenio_id: number;
  nome: string;
  exibir_agendamento_online: number;
  registro_ans: string;
  planos: {
    plano_id: number;
    plano: string;
  }[];
}

interface FeegowDoctorsParamsRequest {
  ativo?: 0 | 1;
  unidade_id?: number;
  especialidade_id?: number;
  convenio_id?: number;
}

interface FeegowDoctorsInsurancesParamsRequest {
  profissional_id: number;
}

interface FeegowDoctorsInsurancesResponse {
  convenio_id: number;
  registro_ans: string;
  nome: string;
}

interface FeegowDoctorsResponse {
  profissional_id: number;
  nome: string;
  CRM: string;
  especialidades: {
    especialidade_id: number;
    nome_especialidade: string;
    CBOS: number;
  }[];
  age_restriction?: {
    idade_minima?: number | null;
    idade_maxima?: number | null;
  };
}

interface FeegowAppointmentTypesParamsRequest {}

interface FeegowAppointmentTypesResponse {
  id: number;
  tipo: string;
}

export {
  FeegowInsurancesParamsRequest,
  FeegowInsurancesResponse,
  FeegowOrganizationUnitsParamsRequest,
  FeegowOrganizationsResponse,
  FeegowProceduresParamsRequest,
  FeegowProceduresResponse,
  FeegowSpecialitiesParamsRequest,
  FeegowSpecialitiesResponse,
  FeegowDoctorsParamsRequest,
  FeegowDoctorsResponse,
  FeegowAppointmentTypesParamsRequest,
  FeegowAppointmentTypesResponse,
  FeegowDoctorsInsurancesParamsRequest,
  FeegowDoctorsInsurancesResponse,
};
