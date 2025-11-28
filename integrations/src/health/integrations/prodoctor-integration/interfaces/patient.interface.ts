// ========== PATIENT INTERFACES ==========
// Aligned with ProDoctor official API swagger

import { CodigoBaseRequest } from './base.interface';

// ========== ENUMS ==========

/**
 * Patient search field enum
 * Aligned with CampoBuscaPaciente from swagger
 */
export enum PatientSearchField {
  NAME = 0,
  CPF = 1,
  PHONE = 2,
}

/**
 * Patient registration state enum
 * Aligned with EstadoRegistro from swagger
 */
export enum PatientRegistrationState {
  ACTIVE = 0,
  INACTIVE = 1,
}

/**
 * Message confirmation sending enum
 * Aligned with EnvioMensagemConfirmacao from swagger
 */
export enum MessageConfirmationSending {
  UNDEFINED = 0,
  ACCEPTS = 1,
  DOES_NOT_ACCEPT = 2,
}

// ========== PHONE ==========

/**
 * Phone request structure
 * Aligned with TelefoneRequest from swagger
 */
export interface PhoneRequest {
  ddd?: string;
  numero?: string;
  tipo?: CodigoBaseRequest;
}

/**
 * Phone view model structure
 * Aligned with TelefoneViewModel from swagger
 */
export interface PhoneViewModel {
  ddd?: string;
  numero?: string;
  tipo?: {
    codigo?: number;
    descricao?: string;
  };
}

// ========== ADDRESS ==========

/**
 * Street type request
 * Aligned with TipoLogradouroRequest from swagger
 */
export interface StreetTypeRequest {
  codigo?: number;
  nome?: string;
}

/**
 * Street request
 * Aligned with LogradouroRequest from swagger
 */
export interface StreetRequest {
  tipo?: CodigoBaseRequest;
  nome?: string;
}

/**
 * Address request structure
 * Aligned with EnderecoRequest from swagger
 */
export interface AddressRequest {
  logradouro?: StreetRequest;
  numero?: number;
  complemento?: string;
  cep?: string;
  bairro?: string;
  cidade?: CodigoBaseRequest;
  uf?: CodigoBaseRequest;
  pais?: CodigoBaseRequest;
}

/**
 * Street type view model
 * Aligned with TipoLogradouroViewModel from swagger
 */
export interface StreetTypeViewModel {
  codigo?: number;
  nome?: string;
}

/**
 * Street view model
 * Aligned with LogradouroViewModel from swagger
 */
export interface StreetViewModel {
  tipo?: StreetTypeViewModel;
  nome?: string;
}

/**
 * Address view model structure
 * Aligned with EnderecoViewModel from swagger
 */
export interface AddressViewModel {
  logradouro?: StreetViewModel;
  numero?: number;
  complemento?: string;
  cep?: string;
  bairro?: string;
  cidade?: {
    codigo?: number;
    nome?: string;
  };
  uf?: {
    codigo?: number;
    nome?: string;
    sigla?: string;
  };
  pais?: {
    codigo?: number;
    nome?: string;
  };
}

// ========== LEGAL GUARDIAN ==========

/**
 * Legal guardian request
 * Aligned with ResponsavelRequest from swagger
 */
export interface LegalGuardianRequest {
  tipo?: CodigoBaseRequest;
  nome?: string;
  cpf?: string;
  telefone?: PhoneRequest;
}

/**
 * Legal guardian view model
 * Aligned with ResponsavelViewModel from swagger
 */
export interface LegalGuardianViewModel {
  tipo?: {
    codigo?: number;
    nome?: string;
  };
  nome?: string;
  cpf?: string;
  telefone?: PhoneViewModel;
}

// ========== PATIENT INSURANCE ==========

/**
 * Patient insurance request
 * Aligned with PacienteConvenioRequest from swagger
 */
export interface PatientInsuranceRequest {
  convenio?: CodigoBaseRequest;
  plano?: string;
  numeroMatricula?: string;
  validade?: string;
  titular?: {
    codigo?: number;
    nome?: string;
    cpf?: string;
  };
  padrao?: boolean;
}

/**
 * Patient insurance view model
 * Aligned with PacienteConvenioViewModel from swagger
 */
export interface PatientInsuranceViewModel {
  convenio?: {
    codigo?: number;
    nome?: string;
  };
  plano?: string;
  numeroMatricula?: string;
  validade?: string;
  titular?: {
    codigo?: number;
    nome?: string;
  };
  padrao?: boolean;
}

// ========== PATIENT REQUEST ==========

/**
 * Patient data for CRUD operations
 * Aligned with PacienteRequest from swagger
 */
export interface PatientDataRequest {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  identidade?: string; // RG
  cartaoNacionalSaude?: string; // CNS
  correioEletronico?: string;
  foto?: string; // Base64
  sexo?: CodigoBaseRequest;
  estadoCivil?: CodigoBaseRequest;
  cor?: CodigoBaseRequest;
  religiao?: CodigoBaseRequest;
  escolaridade?: CodigoBaseRequest;
  profissao?: {
    codigo?: string;
    nome?: string;
  };
  naturalidade?: string;
  nacionalidade?: string;
  enderecoResidencial?: AddressRequest;
  enderecoComercial?: AddressRequest;
  telefone1?: PhoneRequest;
  telefone2?: PhoneRequest;
  telefone3?: PhoneRequest;
  telefone4?: PhoneRequest;
  responsavelLegal?: LegalGuardianRequest;
  responsavelOutro?: LegalGuardianRequest;
  registroConvenio1?: PatientInsuranceRequest;
  registroConvenio2?: PatientInsuranceRequest;
  registroConvenio3?: PatientInsuranceRequest;
  dataCadastro?: string;
  cpfNaoExiste?: boolean;
  pendencia?: string;
  observacao?: string;
}

/**
 * Patient search request
 * Aligned with BasicPacienteSearch from swagger
 * Used for POST /api/v1/Pacientes
 */
export interface PatientSearchRequest {
  termo?: string;
  campo?: PatientSearchField;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, default 5000
}

/**
 * Patient CRUD request wrapper
 * Aligned with PacienteCRUDRequest from swagger
 * Used for POST /api/v1/Pacientes/Inserir and PUT /api/v1/Pacientes/Alterar
 */
export interface PatientCrudRequest {
  codigo?: number;
  suprimirAlertas?: {
    suprimirAlertaValidadeCarteirinha?: boolean;
    suprimirAlertaNomeCivilDiferenteDoNome?: boolean;
  };
  paciente: PatientDataRequest;
}

// ========== PATIENT VIEW MODELS ==========

/**
 * Basic patient view model
 * Aligned with PacienteBasicViewModel from swagger
 * Returned from insert/update operations
 */
export interface PatientBasicViewModel {
  codigo?: number;
  nome?: string;
}

/**
 * Patient list view model
 * Aligned with PacienteListarViewModel from swagger
 * Returned from POST /api/v1/Pacientes
 */
export interface PatientListViewModel {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  telefone1?: PhoneViewModel;
  telefone2?: PhoneViewModel;
  telefone3?: PhoneViewModel;
  telefone4?: PhoneViewModel;
}

/**
 * Patient search view model
 * Aligned with PacienteSearchViewModel from swagger
 * Returned from POST /api/v1/Pacientes/Inserir
 */
export interface PatientSearchViewModel {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  correioEletronico?: string;
  telefone1?: PhoneViewModel;
  telefone2?: PhoneViewModel;
  telefone3?: PhoneViewModel;
  telefone4?: PhoneViewModel;
}

/**
 * Full patient view model
 * Aligned with PacienteViewModel from swagger
 * Returned from GET /api/v1/Pacientes/Detalhar/{codigo}
 */
export interface PatientViewModel {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  identidade?: string; // RG
  cartaoNacionalSaude?: string; // CNS
  correioEletronico?: string;
  foto?: string; // Base64
  sexo?: {
    codigo?: number;
    nome?: string;
  };
  estadoCivil?: {
    codigo?: number;
    nome?: string;
  };
  cor?: {
    codigo?: number;
    nome?: string;
  };
  escolaridade?: {
    codigo?: number;
    nome?: string;
  };
  naturalidade?: string;
  nacionalidade?: string;
  profissao?: string;
  localTrabalho?: string;
  empresa?: string;
  paginaWeb?: string;
  enderecoResidencial?: AddressViewModel;
  enderecoComercial?: AddressViewModel;
  telefone1?: PhoneViewModel;
  telefone2?: PhoneViewModel;
  telefone3?: PhoneViewModel;
  telefone4?: PhoneViewModel;
  responsavelLegal?: LegalGuardianViewModel;
  convenios?: PatientInsuranceViewModel[];
  prontuario?: string;
  cns?: string;
  observacao?: string;
  estadoRegistro?: PatientRegistrationState;
  envioMensagemConfirmacao?: MessageConfirmationSending;
}

// ========== API RESPONSES ==========

/**
 * Patient list response
 * Aligned with PDResponsePacienteListaViewModel from swagger
 * Response from POST /api/v1/Pacientes
 */
export interface PatientListResponse {
  payload: {
    pacientes: PatientListViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Patient search response
 * Aligned with PDResponsePacienteSearchViewModel from swagger
 * Response from POST /api/v1/Pacientes/Inserir
 */
export interface PatientSearchResponse {
  payload: {
    paciente: PatientSearchViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Patient basic response
 * Aligned with PDResponsePacienteBasicViewModel from swagger
 * Response from PUT /api/v1/Pacientes/Alterar
 */
export interface PatientBasicResponse {
  payload: {
    paciente: PatientBasicViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Patient details response
 * Aligned with PDResponsePacienteViewModel from swagger
 * Response from GET /api/v1/Pacientes/Detalhar/{codigo}
 */
export interface PatientDetailsResponse {
  payload: {
    paciente: PatientViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

// ========== LEGACY EXPORTS (for backward compatibility) ==========
// TODO: Remove these after migration is complete

/** @deprecated Use PhoneRequest instead */
export type TelefoneRequest = PhoneRequest;

/** @deprecated Use PhoneViewModel instead */
export type TelefoneViewModel = PhoneViewModel;

/** @deprecated Use AddressRequest instead */
export type EnderecoRequest = AddressRequest;

/** @deprecated Use AddressViewModel instead */
export type EnderecoViewModel = AddressViewModel;

/** @deprecated Use PatientDataRequest instead */
export type PacienteRequest = PatientDataRequest;

/** @deprecated Use PatientSearchRequest instead */
export type ProdoctorGetPatientRequest = PatientSearchRequest;

/** @deprecated Use PatientSearchViewModel instead */
export type ProdoctorGetPatientResponse = PatientSearchViewModel;

/** @deprecated Use PatientSearchRequest instead */
export type listPatientsRequest = PatientSearchRequest;

/** @deprecated Use PatientCrudRequest instead */
export type PacienteCRUDRequest = PatientCrudRequest;

/** @deprecated Use PatientBasicViewModel instead */
export type PacienteBasicViewModel = PatientBasicViewModel;

/** @deprecated Use PatientListViewModel instead */
export type PacienteListarViewModel = PatientListViewModel;

/** @deprecated Use PatientViewModel instead */
export type PacienteViewModel = PatientViewModel;

/** @deprecated Use PatientSearchResponse instead */
export type PDResponsePacienteSearchViewModel = PatientSearchResponse;

/** @deprecated Use PatientBasicResponse instead */
export type PDResponsePacienteBasicViewModel = PatientBasicResponse;

/** @deprecated Use PatientDetailsResponse instead */
export type PDResponsePacienteViewModel = PatientDetailsResponse;

/** @deprecated Use PatientListResponse instead */
export type ProdoctorResponsePatientsListViewModel = PatientListResponse;
