// ========== INTERFACES DE AGENDAMENTO ==========

import { CodigoBaseRequest, PeriodoRequest } from './base.interface';

/**
 * Request para listar agendamentos por usuário
 */
interface AgendamentoListarPorUsuarioRequest {
  usuario: CodigoBaseRequest;
  data: string; // DD/MM/YYYY
  locaisProDoctor?: CodigoBaseRequest[];
}

/**
 * Request para buscar agendamentos de um paciente
 */
interface AgendamentoBuscarRequest {
  paciente: CodigoBaseRequest;
  periodo?: PeriodoRequest;
  locaisProDoctor?: CodigoBaseRequest[];
}

/**
 * Request para detalhar agendamento
 */
interface AgendamentoDetalharRequest {
  codigo: number;
}

/**
 * Request para inserir agendamento
 */
interface AgendamentoInserirRequest {
  paciente: CodigoBaseRequest;
  usuario: CodigoBaseRequest;
  dataHora: string; // DD/MM/YYYY HH:mm
  procedimento: {
    tabela: CodigoBaseRequest;
    codigo: string;
  };
  convenio?: CodigoBaseRequest;
  plano?: CodigoBaseRequest;
  localProDoctor?: CodigoBaseRequest;
  observacao?: string;
  duracao?: number; // minutos
}

/**
 * Request para alterar agendamento
 */
interface AgendamentoAlterarRequest {
  codigo: number;
  dataHora?: string; // DD/MM/YYYY HH:mm
  observacao?: string;
  status?: string;
}

/**
 * Request para cancelar agendamento
 */
interface AgendamentoCancelarRequest {
  codigo: number;
  motivo?: string;
}

/**
 * Request para buscar horários disponíveis
 */
interface HorariosDisponiveisRequest {
  usuario: CodigoBaseRequest;
  procedimento: {
    tabela: CodigoBaseRequest;
    codigo: string;
  };
  periodo: PeriodoRequest;
  localProDoctor?: CodigoBaseRequest;
  convenio?: CodigoBaseRequest;
  plano?: CodigoBaseRequest;
}

/**
 * Agendamento básico (listagem)
 */
interface AgendamentoBasicoViewModel {
  codigo: number;
  dataHora: string;
  paciente: {
    codigo: number;
    nome: string;
  };
  usuario: {
    codigo: number;
    nome: string;
  };
  procedimento: {
    tabela: {
      codigo: number;
      nome: string;
    };
    codigo: string;
    descricao: string;
  };
  status: string;
  convenio?: {
    codigo: number;
    nome: string;
  };
  localProDoctor?: {
    codigo: number;
    nome: string;
  };
  duracao?: number;
}

/**
 * Agendamento detalhado
 */
interface AgendamentoDetalhadoViewModel extends AgendamentoBasicoViewModel {
  observacao?: string;
  plano?: {
    codigo: number;
    nome: string;
  };
  dataConfirmacao?: string;
  dataCancelamento?: string;
  motivoCancelamento?: string;
  valorProcedimento?: number;
  telefone?: string;
  email?: string;
}

/**
 * Dia da agenda com agendamentos
 */
interface DiaAgendaConsultaViewModel {
  data: string; // DD/MM/YYYY
  usuario: {
    codigo: number;
    nome: string;
  };
  agendamentos: AgendamentoBasicoViewModel[];
  totalAgendamentos: number;
}

/**
 * Horário disponível
 */
interface HorarioDisponivelViewModel {
  dataHora: string; // DD/MM/YYYY HH:mm
  disponivel: boolean;
  motivoIndisponibilidade?: string;
}

/**
 * Response de horários disponíveis
 */
interface PDResponseHorariosDisponiveisViewModel {
  payload: {
    horarios: HorarioDisponivelViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response de agendamentos (dia da agenda)
 */
interface PDResponseDiaAgendaConsultaViewModel {
  payload: {
    diaAgendaConsulta: DiaAgendaConsultaViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response de lista de agendamentos
 */
interface PDResponseAgendamentosViewModel {
  payload: {
    agendamentos: AgendamentoBasicoViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response de agendamento detalhado
 */
interface PDResponseAgendamentoDetalhadoViewModel {
  payload: {
    agendamento: AgendamentoDetalhadoViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response de inserção de agendamento
 */
interface PDResponseAgendamentoInseridoViewModel {
  payload: {
    agendamento: {
      codigo: number;
      dataHora: string;
      protocolo?: string;
    };
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response de alteração/cancelamento
 */
interface PDResponseAgendamentoOperacaoViewModel {
  payload: {
    sucesso: boolean;
  };
  sucesso: boolean;
  mensagens: string[];
}

// ========== EXPORTS ==========

export {
  // Requests
  AgendamentoListarPorUsuarioRequest,
  AgendamentoBuscarRequest,
  AgendamentoDetalharRequest,
  AgendamentoInserirRequest,
  AgendamentoAlterarRequest,
  AgendamentoCancelarRequest,
  HorariosDisponiveisRequest,
  // ViewModels
  AgendamentoBasicoViewModel,
  AgendamentoDetalhadoViewModel,
  DiaAgendaConsultaViewModel,
  HorarioDisponivelViewModel,
  // Responses
  PDResponseHorariosDisponiveisViewModel,
  PDResponseDiaAgendaConsultaViewModel,
  PDResponseAgendamentosViewModel,
  PDResponseAgendamentoDetalhadoViewModel,
  PDResponseAgendamentoInseridoViewModel,
  PDResponseAgendamentoOperacaoViewModel,
};
