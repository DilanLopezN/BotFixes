// ========== TIPOS BASE ==========

/**
 * Resposta padrão da API ProDoctor
 */
interface PDResponse<T> {
  payload: T;
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Resposta de erro da API ProDoctor
 */
interface PDErrorResponseViewModel {
  mensagens: string[];
  sucesso: boolean;
}

/**
 * Request base com código
 */
interface CodigoBaseRequest {
  codigo: number;
}

/**
 * Período de busca (datas no formato DD/MM/YYYY)
 */
interface PeriodoRequest {
  dataInicial: string; // DD/MM/YYYY
  dataFinal: string; // DD/MM/YYYY
}

// ========== LOCAL PRODOCTOR (UNIDADE) ==========

interface LocalProdoctorBasicoViewModel {
  codigo: number;
  nome: string;
  cnpjCpf?: string;
  estadoRegistro?: number;
}

interface PDResponseLocalProdoctorBasicoViewModel {
  payload: {
    locaisProDoctor: LocalProdoctorBasicoViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface LocalProdoctorListarRequest {
  termo?: string;
  campo?: number; // 0: Nome, 1: CPF/CNPJ
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, padrão 5000
}

// ========== USUÁRIO (MÉDICO/PROFISSIONAL) ==========

interface EspecialidadeViewModel {
  codigo: number;
  nome: string;
}

interface DadosConselhoViewModel {
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

interface BasicUsuarioViewModel {
  codigo: number;
  nome: string;
  cpf?: string;
  crm?: string;
  cns?: string;
  cnes?: string;
  titulo?: string;
  estadoRegistro?: number;
  ativo?: boolean;
}

interface BasicUsuarioComEspecialidadeViewModel extends BasicUsuarioViewModel {
  especialidade?: EspecialidadeViewModel;
  especialidades?: EspecialidadeViewModel[];
  especialidadeAlternativa?: EspecialidadeViewModel;
  dadosConselho?: DadosConselhoViewModel;
  dadosConselhoAlternativo?: DadosConselhoViewModel;
}

interface UsuarioViewModel extends BasicUsuarioComEspecialidadeViewModel {
  foto?: string;
  email?: string;
  tipo?: number;
  cnpjcpf?: string;
  endereco?: any;
}

interface PDResponseBasicUsuarioViewModel {
  payload: {
    usuarios: BasicUsuarioViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface PDResponseUsuarioComEspecialidadeViewModel {
  payload: {
    usuarios: BasicUsuarioComEspecialidadeViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface PDResponseUsuarioViewModel {
  payload: {
    usuario: UsuarioViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

interface UsuarioListarRequest {
  termo?: string;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, padrão 5000
  locaisProDoctor?: CodigoBaseRequest[];
}

// ========== CONVÊNIO ==========

interface TabelaProcedimentoBasicViewModel {
  codigo: number;
  nome: string;
}

interface ConvenioBasicViewModel {
  codigo: number;
  nome: string;
  estadoRegistro?: number;
  tipoConvenio?: number; // 0: Convênio do médico, 1: Convênio da clínica, 2: Particular
  tabela?: TabelaProcedimentoBasicViewModel;
  ativo?: boolean;
}

interface ConvenioViewModel extends ConvenioBasicViewModel {
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

interface PDResponseConvenioBasicViewModel {
  payload: {
    convenios: ConvenioBasicViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface PDResponseConvenioViewModel {
  payload: {
    convenio: ConvenioViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

interface ConvenioListarRequest {
  termo?: string;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000, padrão 5000
  locaisProDoctor?: CodigoBaseRequest[];
}

// ========== PROCEDIMENTOS ==========

interface ProcedimentoBasicMedicoViewModel {
  codigo: string;
  nome: string;
  tabela?: TabelaProcedimentoBasicViewModel;
  inc?: number;
  m2Filme?: number;
  custoOperacional?: number;
  porteProcedimento?: any;
  multiplicadorPorte?: number;
  honorario?: number;
  numeroAuxiliares?: number;
  porteAnestesico?: any;
  orientacao?: any;
  recebeAssociacao?: boolean;
  procedimentoAssociavel?: boolean;
}

interface ProcedimentoMedicoViewModel extends ProcedimentoBasicMedicoViewModel {
  descricao?: string;
  duracao?: number;
  valor?: number;
  estadoRegistro?: number;
  tipoProcedimento?: number;
  grupoProcedimento?: any;
}

interface PDResponseProcedimentoBasicMedicoViewModel {
  payload: {
    procedimentos: ProcedimentoBasicMedicoViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface PDResponseProcedimentoMedicoViewModel {
  payload: {
    procedimentoMedico: ProcedimentoMedicoViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

interface ProcedimentoListarRequest {
  termo?: string;
  campo?: number; // 0: Nome, 1: Código
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number; // 1-5000
  tabela?: CodigoBaseRequest;
  convenio?: CodigoBaseRequest;
}

// ========== TABELAS DE PROCEDIMENTOS ==========

interface TabelaProcedimentoViewModel {
  codigo: number;
  nome: string;
  descricao?: string;
  estadoRegistro?: number;
  tipoTabela?: number; // 0: AMB, 1: CBHPM
  versao?: string;
}

interface PDResponseTabelaProcedimentoViewModel {
  payload: {
    tabelasProcedimentos: TabelaProcedimentoViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface TabelaProcedimentoListarRequest {
  termo?: string;
  pagina?: number;
  somenteAtivos?: boolean;
  quantidade?: number;
}

// ========== EXPORTS ==========

export {
  // Base
  PDResponse,
  PDErrorResponseViewModel,
  CodigoBaseRequest,
  PeriodoRequest,
  // Local ProDoctor (Unidade)
  LocalProdoctorBasicoViewModel,
  PDResponseLocalProdoctorBasicoViewModel,
  LocalProdoctorListarRequest,
  // Usuário (Médico)
  EspecialidadeViewModel,
  DadosConselhoViewModel,
  BasicUsuarioViewModel,
  BasicUsuarioComEspecialidadeViewModel,
  UsuarioViewModel,
  PDResponseBasicUsuarioViewModel,
  PDResponseUsuarioComEspecialidadeViewModel,
  PDResponseUsuarioViewModel,
  UsuarioListarRequest,
  // Convênio
  TabelaProcedimentoBasicViewModel,
  ConvenioBasicViewModel,
  ConvenioViewModel,
  PDResponseConvenioBasicViewModel,
  PDResponseConvenioViewModel,
  ConvenioListarRequest,
  // Procedimentos
  ProcedimentoBasicMedicoViewModel,
  ProcedimentoMedicoViewModel,
  PDResponseProcedimentoBasicMedicoViewModel,
  PDResponseProcedimentoMedicoViewModel,
  ProcedimentoListarRequest,
  // Tabelas de Procedimentos
  TabelaProcedimentoViewModel,
  PDResponseTabelaProcedimentoViewModel,
  TabelaProcedimentoListarRequest,
};
