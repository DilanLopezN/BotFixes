interface InsurancesResponse {
  Id: number;
  Nome: string;
  Ativo: boolean;
}

interface DoctorsResponse {
  Id: number;
  Nome: string;
  ObservacaoAgendamento: string;
}

interface InsurancesParamsRequest {
  idUnidade?: number;
}

interface DoctorsParamsRequest {
  IdUnidade?: number;
  IdConvenio?: number;
  IdEspecialidade?: number;
  IdProcedimento?: number;
}

interface SpecialitiesResponse {
  Id: number;
  Nome: string;
}

interface ProceduresResponse {
  Id: number;
  Nome: string;
  IdProcedimentoSistema?: number;
  CodigoExternoGrupo?: string;
  Especialidades: {
    Id: number;
    Nome: string;
  }[];
}

interface InsurancePlansResponse {
  Id: number;
  Nome: string;
}

interface ProceduresParamsRequest {
  IdGrupoProcedimento?: number;
  IdProcedimento?: number;
  NomeProcedimento?: string;
  IdProfissional?: number;
  NomeProfissional?: string;
  IdUnidade?: number;
  NomeUnidade?: string;
  IdConvenio?: number;
  IdPlano?: number;
  IdEspecialidade?: number;
}

interface SpecialitiesParamsRequest {
  IdUnidade?: number;
  IdConvenio?: number;
}

interface InsurancePlansParamsRequest {
  IdConvenio?: number;
}

interface OrganizationUnitsResponse {
  Id: number;
  Nome: string;
}

interface ResourcesResponse {}

export {
  InsurancesResponse,
  SpecialitiesResponse,
  ProceduresResponse,
  OrganizationUnitsResponse,
  DoctorsResponse,
  ResourcesResponse,
  InsurancePlansResponse,
  InsurancesParamsRequest,
  ProceduresParamsRequest,
  SpecialitiesParamsRequest,
  InsurancePlansParamsRequest,
  DoctorsParamsRequest,
};
