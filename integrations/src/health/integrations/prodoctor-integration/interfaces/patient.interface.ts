// ========== PATIENT INTERFACES ==========
// Aligned with ProDoctor official API swagger

import { CodeRequest } from './base.interface';

// ========== ENUMS ==========

/**
 * Patient search field enum
 * Aligned with CampoBuscaPaciente from swagger
 */
export enum ProdoctorPatientSearchField {
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
  tipo?: CodeRequest;
}

/**
 * Phone view model structure
 * Aligned with TelefoneViewModel from swagger
 */
export interface PatientPhoneResponse {
  numero?: string;
  tipoTelefone?: {
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
  tipo?: CodeRequest;
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
  cidade?: CodeRequest;
  uf?: CodeRequest;
  pais?: CodeRequest;
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
export interface ProdoctorLegalGuardianRequest {
  tipo?: CodeRequest;
  nome?: string;
  cpf?: string;
  telefone?: PhoneRequest;
}

/**
 * Legal guardian view model
 * Aligned with ResponsavelViewModel from swagger
 */
export interface ProdoctorLegalGuardianData {
  tipo?: {
    codigo?: number;
    nome?: string;
  };
  nome?: string;
  cpf?: string;
  telefone?: PatientPhoneResponse;
}

// ========== PATIENT INSURANCE ==========

/**
 * Patient insurance request
 * Aligned with PacienteConvenioRequest from swagger
 */
export interface ProdoctorInsurancePatientRequest {
  convenio?: CodeRequest;
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
export interface ProdoctorInsurancePatientData {
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
export interface ProdoctorPatientDataRequest {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  identidade?: string; // RG
  cartaoNacionalSaude?: string; // CNS
  correioEletronico?: string;
  foto?: string; // Base64
  sexo?: CodeRequest;
  estadoCivil?: CodeRequest;
  cor?: CodeRequest;
  religiao?: CodeRequest;
  escolaridade?: CodeRequest;
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
  responsavelLegal?: ProdoctorLegalGuardianRequest;
  responsavelOutro?: ProdoctorLegalGuardianRequest;
  registroConvenio1?: ProdoctorInsurancePatientRequest;
  registroConvenio2?: ProdoctorInsurancePatientRequest;
  registroConvenio3?: ProdoctorInsurancePatientRequest;
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
export interface ProdoctorPatientSearchRequest {
  termo?: string;
  campo?: ProdoctorPatientSearchField;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, default 5000
}

/**
 * Patient CRUD request wrapper
 * Aligned with PacienteCRUDRequest from swagger
 * Used for POST /api/v1/Pacientes/Inserir and PUT /api/v1/Pacientes/Alterar
 */
export interface ProdoctorPatientRequest {
  codigo?: number;
  suprimirAlertas?: {
    suprimirAlertaValidadeCarteirinha?: boolean;
    suprimirAlertaNomeCivilDiferenteDoNome?: boolean;
  };
  paciente: ProdoctorPatientDataRequest;
}

// ========== PATIENT VIEW MODELS ==========

/**
 * Basic patient view model
 * Aligned with PacienteBasicViewModel from swagger
 * Returned from insert/update operations
 */
export interface ProdoctorUpdatePatientDetails {
  codigo?: number;
  nome?: string;
}

/**
 * Patient list view model
 * Aligned with PacienteListarViewModel from swagger
 * Returned from POST /api/v1/Pacientes
 */
export interface ProdoctorGetPatientResponse {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  telefone1?: PatientPhoneResponse;
  telefone2?: PatientPhoneResponse;
  telefone3?: PatientPhoneResponse;
  telefone4?: PatientPhoneResponse;
}

/**
 * Patient search view model
 * Aligned with PacienteSearchViewModel from swagger
 * Returned from POST /api/v1/Pacientes/Inserir
 */
export interface ProdoctorCreatePatientDetails {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  correioEletronico?: string;
  telefone1?: PatientPhoneResponse;
  telefone2?: PatientPhoneResponse;
  telefone3?: PatientPhoneResponse;
  telefone4?: PatientPhoneResponse;
}

/**
 * Full patient view model
 * Aligned with PacienteViewModel from swagger
 * Returned from GET /api/v1/Pacientes/Detalhar/{codigo}
 */
export interface ProdoctorPatientResponse {
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
  telefone1?: PatientPhoneResponse;
  telefone2?: PatientPhoneResponse;
  telefone3?: PatientPhoneResponse;
  telefone4?: PatientPhoneResponse;
  responsavelLegal?: ProdoctorLegalGuardianData;
  convenios?: ProdoctorInsurancePatientData[];
  prontuario?: string;
  cns?: string;
  observacao?: string;
  estadoRegistro?: PatientRegistrationState;
  envioMensagemConfirmacao?: MessageConfirmationSending;
}

// ========== API RESPONSES ==========

export interface ProdoctorResponseSexosViewModel {
  sucesso: boolean;
  mensagem: string | null;
  payload: {
    sexos: Array<{
      codigo: number;
      nome: string;
    }>;
  };
}

/**
 * Patient list response
 * Aligned with PDResponsePacienteListaViewModel from swagger
 * Response from POST /api/v1/Pacientes
 */
export interface ProdoctorListPatientResponse {
  payload: {
    pacientes: ProdoctorGetPatientResponse[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Patient search response
 * Aligned with PDResponsePacienteSearchViewModel from swagger
 * Response from POST /api/v1/Pacientes/Inserir
 */
export interface ProdoctorCreatePatientResponse {
  payload: {
    paciente: ProdoctorCreatePatientDetails;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Patient basic response
 * Aligned with PDResponsePacienteBasicViewModel from swagger
 * Response from PUT /api/v1/Pacientes/Alterar
 */
export interface ProdoctorUpdatePatientResponse {
  payload: {
    paciente: ProdoctorUpdatePatientDetails;
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
    paciente: ProdoctorPatientResponse;
  };
  sucesso: boolean;
  mensagens: string[];
}
