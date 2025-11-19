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
  dataInicio: string; // DD/MM/YYYY
  dataFim: string; // DD/MM/YYYY
}

// ========== LOCAL PRODOCTOR ==========

interface LocalProdoctorBasicoViewModel {
  codigo: number;
  nome: string;
}

interface PDResponseLocalProdoctorBasicoViewModel {
  payload: {
    locaisProDoctor: LocalProdoctorBasicoViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface LocalProdoctorListarRequest {
  quantidade?: number; // 1-5000, padrão 5000
}

// ========== USUÁRIO (MÉDICO/PROFISSIONAL) ==========

interface EspecialidadeViewModel {
  codigo: number;
  nome: string;
}

interface BasicUsuarioViewModel {
  codigo: number;
  nome: string;
  cpf: string;
  crm: string;
  ativo: boolean;
}

interface BasicUsuarioComEspecialidadeViewModel extends BasicUsuarioViewModel {
  especialidades: EspecialidadeViewModel[];
}

interface PDResponseBasicUsuarioViewModel {
  payload: {
    usuarios: BasicUsuarioViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface UsuarioListarRequest {
  quantidade?: number; // 1-5000, padrão 5000
  locaisProDoctor?: CodigoBaseRequest[];
}

// ========== CONVÊNIO ==========

interface ConvenioBasicViewModel {
  codigo: number;
  nome: string;
  ativo: boolean;
}

interface PDResponseConvenioBasicViewModel {
  payload: {
    convenios: ConvenioBasicViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

interface ConvenioListarRequest {
  quantidade?: number; // 1-5000, padrão 5000
  locaisProDoctor?: CodigoBaseRequest[];
}

// ========== EXPORTS ==========

export {
  // Base
  PDResponse,
  PDErrorResponseViewModel,
  CodigoBaseRequest,
  PeriodoRequest,
  // Local ProDoctor
  LocalProdoctorBasicoViewModel,
  PDResponseLocalProdoctorBasicoViewModel,
  LocalProdoctorListarRequest,
  // Usuário
  EspecialidadeViewModel,
  BasicUsuarioViewModel,
  BasicUsuarioComEspecialidadeViewModel,
  PDResponseBasicUsuarioViewModel,
  UsuarioListarRequest,
  // Convênio
  ConvenioBasicViewModel,
  PDResponseConvenioBasicViewModel,
  ConvenioListarRequest,
};
