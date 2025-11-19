// ========== PACIENTE - INTERFACES ==========

import { CodigoBaseRequest, LocalProdoctorBasicoViewModel } from './base.interface';

/**
 * Telefone do paciente
 */
interface TelefoneRequest {
  ddd: string;
  numero: string;
  ramal?: string;
  observacao?: string;
  tipo: CodigoBaseRequest; // 1=Residencial, 2=Comercial, 3=Celular, etc
}

interface TelefoneViewModel {
  ddd: string;
  numero: string;
  ramal?: string;
  observacao?: string;
  tipo: TipoTelefoneViewModel;
}

interface TipoTelefoneViewModel {
  codigo: number;
  nome: string;
}

/**
 * Endereço do paciente
 */
interface EnderecoRequest {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: CodigoBaseRequest;
  estado?: CodigoBaseRequest;
}

interface EnderecoViewModel {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: CidadeViewModel;
  estado?: EstadoViewModel;
}

interface CidadeViewModel {
  codigo: number;
  nome: string;
}

interface EstadoViewModel {
  codigo: number;
  nome: string;
  sigla: string;
}

/**
 * Dados básicos do paciente
 */
interface PacienteBasicViewModel {
  codigo: number;
  nome: string;
  cpf: string;
  dataNascimento: string; // DD/MM/YYYY
  sexo?: SexoViewModel;
  email?: string;
  telefone?: TelefoneViewModel;
}

interface SexoViewModel {
  codigo: number; // 1=M, 2=F
  nome: string;
}

/**
 * Dados completos do paciente
 */
interface PacienteViewModel extends PacienteBasicViewModel {
  nomeSocial?: string;
  nomeMae?: string;
  estadoCivil?: EstadoCivilViewModel;
  escolaridade?: EscolaridadeViewModel;
  profissao?: ProfissaoViewModel;
  cor?: CorViewModel;
  rg?: string;
  orgaoEmissor?: string;
  endereco?: EnderecoViewModel;
  telefone2?: TelefoneViewModel;
  telefone3?: TelefoneViewModel;
  telefone4?: TelefoneViewModel;
  observacao?: string;
  localProDoctor?: LocalProdoctorBasicoViewModel;
}

interface EstadoCivilViewModel {
  codigo: number;
  nome: string;
}

interface EscolaridadeViewModel {
  codigo: number;
  nome: string;
}

interface ProfissaoViewModel {
  codigo: number;
  nome: string;
}

interface CorViewModel {
  codigo: number;
  nome: string;
}

/**
 * Request para buscar paciente
 */
interface PacienteBuscarRequest {
  cpf?: string;
  nome?: string;
  telefone?: string;
  localProDoctor?: CodigoBaseRequest;
}

/**
 * Request para inserir/alterar paciente (CRUD)
 */
interface PacienteCRUDRequest {
  paciente: {
    codigo?: number; // Apenas para alterar
    nome: string;
    cpf: string;
    dataNascimento: string; // DD/MM/YYYY
    sexo?: CodigoBaseRequest; // 1=M, 2=F
    nomeSocial?: string;
    nomeMae?: string;
    estadoCivil?: CodigoBaseRequest;
    escolaridade?: CodigoBaseRequest;
    profissao?: CodigoBaseRequest;
    cor?: CodigoBaseRequest;
    rg?: string;
    orgaoEmissor?: string;
    email?: string;
    endereco?: EnderecoRequest;
    telefone?: TelefoneRequest;
    telefone2?: TelefoneRequest;
    telefone3?: TelefoneRequest;
    telefone4?: TelefoneRequest;
    observacao?: string;
  };
  localProDoctor: CodigoBaseRequest;
}

/**
 * Response de buscar paciente
 */
interface PacienteSearchViewModel {
  codigo: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo?: SexoViewModel;
  telefone?: TelefoneViewModel;
  email?: string;
}

/**
 * Response padrão de buscar paciente
 */
interface PDResponsePacienteSearchViewModel {
  payload: {
    paciente: PacienteSearchViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response padrão de paciente básico
 */
interface PDResponsePacienteBasicViewModel {
  payload: {
    paciente: PacienteBasicViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response padrão de paciente completo
 */
interface PDResponsePacienteViewModel {
  payload: {
    paciente: PacienteViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Request para listar pacientes
 */
interface PacienteListarRequest {
  quantidade?: number; // 1-5000
  pagina?: number;
  nome?: string;
  cpf?: string;
  telefone?: string;
  locaisProDoctor?: CodigoBaseRequest[];
}

/**
 * View model para listagem de pacientes
 */
interface PacienteListarViewModel {
  codigo: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone?: string;
  email?: string;
}

/**
 * Response de listagem de pacientes
 */
interface PDResponsePacienteListaViewModel {
  payload: {
    pacientes: PacienteListarViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

// Re-export tipos base necessários
export { CodigoBaseRequest, LocalProdoctorBasicoViewModel } from './base.interface';

// Exports
export {
  // Telefone
  TelefoneRequest,
  TelefoneViewModel,
  TipoTelefoneViewModel,
  // Endereço
  EnderecoRequest,
  EnderecoViewModel,
  CidadeViewModel,
  EstadoViewModel,
  // Paciente
  PacienteBasicViewModel,
  PacienteViewModel,
  PacienteSearchViewModel,
  PacienteListarViewModel,
  SexoViewModel,
  EstadoCivilViewModel,
  EscolaridadeViewModel,
  ProfissaoViewModel,
  CorViewModel,
  // Requests
  PacienteBuscarRequest,
  PacienteCRUDRequest,
  PacienteListarRequest,
  // Responses
  PDResponsePacienteSearchViewModel,
  PDResponsePacienteBasicViewModel,
  PDResponsePacienteViewModel,
  PDResponsePacienteListaViewModel,
};
