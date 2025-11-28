// ========== BASE INTERFACES ==========
// Aligned with ProDoctor official API swagger

// ========== BASE TYPES ==========

/**
 * Standard ProDoctor API response wrapper
 * Aligned with PDResponse from swagger
 */
export interface ApiResponse<T> {
  payload: T;
  sucesso: boolean;
  mensagens: string[];
}

/**
 * ProDoctor API error response
 * Aligned with PDErrorResponseViewModel from swagger
 */
export interface ApiErrorResponse {
  mensagens: string[];
  sucesso: boolean;
}

/**
 * Base code request
 * Aligned with CodigoBaseRequest from swagger
 */
export interface CodeRequest {
  codigo: number;
}

/**
 * Search period request
 * Dates in DD/MM/YYYY format
 * Aligned with PeriodoRequest from swagger
 */
export interface PeriodRequest {
  dataInicial: string; // DD/MM/YYYY
  dataFinal: string; // DD/MM/YYYY
}

// ========== ENUMS ==========

/**
 * Registration state enum
 * Aligned with EstadoRegistro from swagger
 */
export enum RegistrationState {
  ACTIVE = 0,
  INACTIVE = 1,
}

/**
 * Location search field enum
 * Aligned with CampoBuscaLocalProDoctor from swagger
 */
export enum LocationSearchField {
  NAME = 0,
  CPF_CNPJ = 1,
}

/**
 * Procedure search field enum
 * Aligned with CampoBuscaProcedimento from swagger
 */
export enum ProcedureSearchField {
  NAME = 0,
  CODE = 1,
}

// ========== PRODOCTOR LOCATION (ORGANIZATION UNIT) ==========

/**
 * Basic location view model
 * Aligned with LocalProdoctorBasicoViewModel from swagger
 */
export interface LocationBasicViewModel {
  codigo: number;
  nome: string;
  cnpjCpf?: string;
  estadoRegistro?: RegistrationState;
}

/**
 * Location list response
 * Aligned with PDResponseLocalProdoctorBasicoViewModel from swagger
 */
export interface LocationListResponse {
  payload: {
    locaisProDoctor: LocationBasicViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Location search request
 * Aligned with BasicLocalProDoctorSearch from swagger
 */
export interface LocationSearchRequest {
  termo?: string;
  campo?: LocationSearchField;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, default 5000
}

// ========== USER (DOCTOR/PROFESSIONAL) ==========

/**
 * Speciality view model
 * Aligned with EspecialidadeViewModel from swagger
 */
export interface SpecialityViewModel {
  codigo: number;
  nome: string;
}

/**
 * Professional council data view model
 * Aligned with DadosConselhoViewModel from swagger
 */
export interface ProfessionalCouncilViewModel {
  conselhoProfissional?: {
    codigo?: number;
    nome?: string;
    sigla?: string;
  };
  numero?: string;
  uf?: {
    codigo?: number;
    nome?: string;
    sigla?: string;
  };
}

/**
 * Orientation view model
 * Aligned with OrientacaoViewModel from swagger
 */
export interface OrientationViewModel {
  html?: string;
  texto?: string;
}

/**
 * Basic user view model
 * Aligned with BasicUsuarioViewModel from swagger
 */
export interface UserBasicViewModel {
  codigo: number;
  nome: string;
  cpf?: string;
  crm?: string;
  cns?: string;
  cnes?: string;
  titulo?: string;
  estadoRegistro?: RegistrationState;
  ativo?: boolean;
}

/**
 * User with speciality view model
 * Aligned with BasicUsuarioComEspecialidadeViewModel from swagger
 */
export interface UserWithSpecialityViewModel extends UserBasicViewModel {
  especialidade?: SpecialityViewModel;
  especialidades?: SpecialityViewModel[];
  especialidadeAlternativa?: SpecialityViewModel;
  dadosConselho?: ProfessionalCouncilViewModel;
  dadosConselhoAlternativo?: ProfessionalCouncilViewModel;
  orientacao?: OrientationViewModel;
}

/**
 * Full user view model
 * Aligned with UsuarioViewModel from swagger
 */
export interface UserViewModel extends UserWithSpecialityViewModel {
  foto?: string;
  email?: string;
  tipo?: number;
  cnpjcpf?: string;
  endereco?: any;
}

/**
 * User list response (basic)
 * Aligned with PDResponseBasicUsuarioViewModel from swagger
 */
export interface UserBasicListResponse {
  payload: {
    usuarios: UserBasicViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * User list response (with speciality)
 * Aligned with PDResponseBasicUsuarioComEspecialidadeViewModel from swagger
 */
export interface UserWithSpecialityListResponse {
  payload: {
    usuarios: UserWithSpecialityViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * User details response
 * Aligned with PDResponseUsuarioViewModel from swagger
 */
export interface UserDetailsResponse {
  payload: {
    usuario: UserViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * User search request
 * Aligned with BasicUsuarioSearch from swagger
 */
export interface UserSearchRequest {
  termo?: string;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, default 5000
  locaisProDoctor?: CodeRequest[];
}

// ========== INSURANCE ==========

/**
 * Basic procedure table view model
 * Aligned with TabelaProcedimentoBasicViewModel from swagger
 */
export interface ProcedureTableBasicViewModel {
  codigo: number;
  nome: string;
}

/**
 * Basic insurance view model
 * Aligned with ConvenioBasicViewModel from swagger
 */
export interface InsuranceBasicViewModel {
  codigo: number;
  nome: string;
  estadoRegistro?: RegistrationState;
  tipoConvenio?: number; // 0: Doctor's, 1: Clinic's, 2: Private
  tabela?: ProcedureTableBasicViewModel;
  ativo?: boolean;
}

/**
 * Full insurance view model
 * Aligned with ConvenioViewModel from swagger
 */
export interface InsuranceViewModel extends InsuranceBasicViewModel {
  procedimentoObrigatorio?: boolean;
  numeroContrato?: string;
  empresa?: any;
  usuario?: any;
  faturaAtual?: number;
  tipoPessoa?: number;
  cnpjCpf?: string;
  endereco?: any;
  telefone1?: any;
  telefone2?: any;
  telefone3?: any;
  telefone4?: any;
  logotipo?: string;
}

/**
 * Insurance list response
 * Aligned with PDResponseConvenioBasicViewModel from swagger
 */
export interface InsuranceListResponse {
  payload: {
    convenios: InsuranceBasicViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Insurance details response
 * Aligned with PDResponseConvenioViewModel from swagger
 */
export interface InsuranceDetailsResponse {
  payload: {
    convenio: InsuranceViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Insurance search request
 * Aligned with BasicConvenioSearch from swagger
 */
export interface InsuranceSearchRequest {
  termo?: string;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, default 5000
}

// ========== PROCEDURES ==========

/**
 * Basic medical procedure view model
 * Aligned with ProcedimentoBasicMedicoViewModel from swagger
 */
export interface ProcedureBasicViewModel {
  codigo: string;
  nome: string;
  tabela?: ProcedureTableBasicViewModel;
  inc?: number;
  m2Filme?: number;
  custoOperacional?: number;
  porteProcedimento?: any;
  multiplicadorPorte?: number;
  honorario?: number;
  numeroAuxiliares?: number;
  porteAnestesico?: any;
  orientacao?: OrientationViewModel;
  recebeAssociacao?: boolean;
  procedimentoAssociavel?: boolean;
}

/**
 * Full medical procedure view model
 * Aligned with ProcedimentoMedicoViewModel from swagger
 */
export interface ProcedureViewModel extends ProcedureBasicViewModel {
  descricao?: string;
  duracao?: number;
  valor?: number;
  estadoRegistro?: RegistrationState;
  tipoProcedimento?: number;
  grupoProcedimento?: any;
}

/**
 * Procedure list response
 * Aligned with PDResponseProcedimentoBasicMedicoViewModel from swagger
 */
export interface ProcedureListResponse {
  payload: {
    procedimentos: ProcedureBasicViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Procedure details response
 * Aligned with PDResponseProcedimentoMedicoViewModel from swagger
 */
export interface ProcedureDetailsResponse {
  payload: {
    procedimentoMedico: ProcedureViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Procedure search request
 * Aligned with BasicProcedimentoSearch from swagger
 */
export interface ProcedureSearchRequest {
  termo?: string;
  campo?: ProcedureSearchField;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, default 5000
  tabela?: CodeRequest;
  convenio?: CodeRequest;
}

// ========== PROCEDURE TABLES ==========

/**
 * Procedure table type enum
 * Aligned with TipoTabela from swagger
 */
export enum ProcedureTableType {
  AMB = 0,
  CBHPM = 1,
}

/**
 * Full procedure table view model
 * Aligned with TabelaProcedimentoViewModel from swagger
 */
export interface ProcedureTableViewModel {
  codigo: number;
  nome: string;
  descricao?: string;
  estadoRegistro?: RegistrationState;
  tipoTabela?: ProcedureTableType;
  versao?: string;
}

/**
 * Procedure table list response
 * Aligned with PDResponseTabelaProcedimentoViewModel from swagger
 */
export interface ProcedureTableListResponse {
  payload: {
    tabelasProcedimentos: ProcedureTableViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Procedure table search request
 * Aligned with BasicTabelasProcedimentosSearch from swagger
 */
export interface ProcedureTableSearchRequest {
  termo?: string;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, default 5000
}

// ========== LEGACY EXPORTS (for backward compatibility) ==========
// TODO: Remove these after migration is complete

/** @deprecated Use ApiResponse instead */
export type PDResponse<T> = ApiResponse<T>;

/** @deprecated Use ApiErrorResponse instead */
export type PDErrorResponseViewModel = ApiErrorResponse;

/** @deprecated Use CodeRequest instead */
export type CodigoBaseRequest = CodeRequest;

/** @deprecated Use PeriodRequest instead */
export type PeriodoRequest = PeriodRequest;

/** @deprecated Use LocationBasicViewModel instead */
export type LocalProdoctorBasicoViewModel = LocationBasicViewModel;

/** @deprecated Use LocationListResponse instead */
export type ProdoctorResponseLocationsBasicViewModel = LocationListResponse;

/** @deprecated Use LocationSearchRequest instead */
export type LocationsProdoctorListRequest = LocationSearchRequest;

/** @deprecated Use SpecialityViewModel instead */
export type EspecialidadeViewModel = SpecialityViewModel;

/** @deprecated Use ProfessionalCouncilViewModel instead */
export type DadosConselhoViewModel = ProfessionalCouncilViewModel;

/** @deprecated Use UserBasicViewModel instead */
export type BasicUsuarioViewModel = UserBasicViewModel;

/** @deprecated Use UserWithSpecialityViewModel instead */
export type BasicUsuarioComEspecialidadeViewModel = UserWithSpecialityViewModel;

/** @deprecated Use UserViewModel instead */
export type UsuarioViewModel = UserViewModel;

/** @deprecated Use UserBasicListResponse instead */
export type ProdoctorResponseBasicUserViewModel = UserBasicListResponse;

/** @deprecated Use UserWithSpecialityListResponse instead */
export type ProdoctorResponseUserWithSpecialityViewModel = UserWithSpecialityListResponse;

/** @deprecated Use UserDetailsResponse instead */
export type ProdoctorResponseMedicalUserViewModel = UserDetailsResponse;

/** @deprecated Use UserSearchRequest instead */
export type UserListRequest = UserSearchRequest;

/** @deprecated Use ProcedureTableBasicViewModel instead */
export type TabelaProcedimentoBasicViewModel = ProcedureTableBasicViewModel;

/** @deprecated Use InsuranceBasicViewModel instead */
export type ConvenioBasicViewModel = InsuranceBasicViewModel;

/** @deprecated Use InsuranceViewModel instead */
export type ConvenioViewModel = InsuranceViewModel;

/** @deprecated Use InsuranceListResponse instead */
export type ProdoctorResponseInsurancesBasicViewModel = InsuranceListResponse;

/** @deprecated Use InsuranceDetailsResponse instead */
export type PDResponseConvenioViewModel = InsuranceDetailsResponse;

/** @deprecated Use InsuranceSearchRequest instead */
export type InsurancesListRequest = InsuranceSearchRequest;

/** @deprecated Use ProcedureBasicViewModel instead */
export type ProcedimentoBasicMedicoViewModel = ProcedureBasicViewModel;

/** @deprecated Use ProcedureViewModel instead */
export type ProcedimentoMedicoViewModel = ProcedureViewModel;

/** @deprecated Use ProcedureListResponse instead */
export type ProdoctorResponseProceduresBasicMedicalViewModel = ProcedureListResponse;

/** @deprecated Use ProcedureDetailsResponse instead */
export type ProdoctorResponseProcedureMedicalViewModel = ProcedureDetailsResponse;

/** @deprecated Use ProcedureSearchRequest instead */
export type ProceduresListRequest = ProcedureSearchRequest;

/** @deprecated Use ProcedureTableViewModel instead */
export type TabelaProcedimentoViewModel = ProcedureTableViewModel;

/** @deprecated Use ProcedureTableListResponse instead */
export type PDResponseTabelaProcedimentoViewModel = ProcedureTableListResponse;

/** @deprecated Use ProcedureTableSearchRequest instead */
export type TabelaProceduresListRequest = ProcedureTableSearchRequest;
