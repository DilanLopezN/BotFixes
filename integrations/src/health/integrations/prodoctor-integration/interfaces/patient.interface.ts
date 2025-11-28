// ========== INTERFACES DE PACIENTE ==========

import { CodigoBaseRequest } from './base.interface';

/**
 * Telefone do ProDoctor
 */
interface TelefoneRequest {
  ddd?: string;
  numero?: string;
  tipo?: CodigoBaseRequest;
}

interface TelefoneViewModel {
  ddd?: string;
  numero?: string;
  tipo?: {
    codigo?: number;
    descricao?: string;
  };
}

/**
 * Endereço do ProDoctor
 */
interface EnderecoRequest {
  logradouro?: {
    tipo?: CodigoBaseRequest;
    nome?: string;
  };
  numero?: number;
  complemento?: string;
  cep?: string;
  bairro?: string;
  cidade?: CodigoBaseRequest;
  uf?: CodigoBaseRequest;
  pais?: CodigoBaseRequest;
}

interface EnderecoViewModel {
  logradouro?: {
    tipo?: {
      codigo?: number;
      nome?: string;
    };
    nome?: string;
  };
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

/**
 * Request de paciente para CRUD
 */
interface PacienteRequest {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string; // DD/MM/YYYY
  cpf?: string;
  rg?: string;
  correioEletronico?: string;
  foto?: string; // Base64
  sexo?: CodigoBaseRequest;
  estadoCivil?: CodigoBaseRequest;
  cor?: CodigoBaseRequest;
  escolaridade?: CodigoBaseRequest;
  naturalidade?: string;
  nacionalidade?: string;
  profissao?: string;
  localTrabalho?: string;
  enderecoResidencial?: EnderecoRequest;
  enderecoComercial?: EnderecoRequest;
  telefone1?: TelefoneRequest;
  telefone2?: TelefoneRequest;
  telefone3?: TelefoneRequest;
  telefone4?: TelefoneRequest;
  responsavelLegal?: {
    tipo?: CodigoBaseRequest;
    nome?: string;
    cpf?: string;
    telefone?: TelefoneRequest;
  };
  convenios?: Array<{
    convenio?: CodigoBaseRequest;
    plano?: string;
    numeroMatricula?: string;
    validade?: string;
    padrao?: boolean;
  }>;
  observacao?: string;
  prontuario?: string;
  cns?: string;
  envioMensagemConfirmacao?: number; // 0: Indefinido, 1: Aceita, 2: Não aceita
}

/**
 * Request para busca de paciente por CPF
 */
interface ProdoctorGetPatientRequest {
  campo: number;
  termo: string;
  somenteAtivos?: boolean;

  localProDoctor?: CodigoBaseRequest;
}

/**
 * Request para listagem de pacientes
 */
interface listPatientsRequest {
  termo?: string;
  campo?: number; // 0: Nome, 1: CPF, 2: Telefone
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000
}

/**
 * Request para CRUD de paciente
 */
interface PacienteCRUDRequest {
  codigo?: number;
  suprimirAlertas?: {
    suprimirAlertaValidadeCarteirinha?: boolean;
    suprimirAlertaNomeCivilDiferenteDoNome?: boolean;
  };
  paciente: PacienteRequest;
}

/**
 * ViewModel de paciente básico
 */
interface PacienteBasicViewModel {
  codigo?: number;
  nome?: string;
}

/**
 * ViewModel de paciente para busca/insert
 */
interface ProdoctorGetPatientResponse {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string;
  cpf?: string;
  correioEletronico?: string;
  telefone1?: TelefoneViewModel;
  telefone2?: TelefoneViewModel;
  telefone3?: TelefoneViewModel;
  telefone4?: TelefoneViewModel;
}

/**
 * ViewModel de paciente para listagem
 */
interface PacienteListarViewModel {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string;
  cpf?: string;
  telefone1?: TelefoneViewModel;
  telefone2?: TelefoneViewModel;
  telefone3?: TelefoneViewModel;
  telefone4?: TelefoneViewModel;
}

/**
 * ViewModel completo de paciente
 */
interface PacienteViewModel {
  codigo?: number;
  nome?: string;
  nomeCivil?: string;
  dataNascimento?: string;
  cpf?: string;
  rg?: string;
  correioEletronico?: string;
  foto?: string;
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
  enderecoResidencial?: EnderecoViewModel;
  enderecoComercial?: EnderecoViewModel;
  telefone1?: TelefoneViewModel;
  telefone2?: TelefoneViewModel;
  telefone3?: TelefoneViewModel;
  telefone4?: TelefoneViewModel;
  responsavelLegal?: {
    tipo?: {
      codigo?: number;
      nome?: string;
    };
    nome?: string;
    cpf?: string;
    telefone?: TelefoneViewModel;
  };
  convenios?: Array<{
    convenio?: {
      codigo?: number;
      nome?: string;
    };
    plano?: string;
    numeroMatricula?: string;
    validade?: string;
    padrao?: boolean;
  }>;
  observacao?: string;
  prontuario?: string;
  cns?: string;
  estadoRegistro?: number; // 0: Ativo, 1: Inativo
  envioMensagemConfirmacao?: number;
}

// ========== RESPONSES ==========

interface PDResponsePacienteSearchViewModel {
  payload: {
    paciente: ProdoctorGetPatientResponse;
  };
  sucesso: boolean;
  mensagens: string[];
}

interface PDResponsePacienteBasicViewModel {
  payload: {
    paciente: PacienteBasicViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

interface PDResponsePacienteViewModel {
  payload: {
    paciente: PacienteViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

interface ProdoctorResponsePatientsListViewModel {
  payload: {
    pacientes: PacienteListarViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

// ========== EXPORTS ==========

export {
  // Telefone
  TelefoneRequest,
  TelefoneViewModel,
  // Endereço
  EnderecoRequest,
  EnderecoViewModel,
  // Request
  PacienteRequest,
  ProdoctorGetPatientResponse,
  ProdoctorGetPatientRequest,
  listPatientsRequest,
  PacienteCRUDRequest,
  // ViewModel
  PacienteBasicViewModel,
  PacienteListarViewModel,
  PacienteViewModel,
  // Response
  PDResponsePacienteSearchViewModel,
  PDResponsePacienteBasicViewModel,
  PDResponsePacienteViewModel,
  ProdoctorResponsePatientsListViewModel,
};
