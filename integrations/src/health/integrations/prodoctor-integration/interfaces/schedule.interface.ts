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
 * Tipo de agendamento
 */
interface TipoAgendamentoRequest {
  consulta?: boolean;
  retorno?: boolean;
  exame?: boolean;
  cirurgia?: boolean;
  compromisso?: boolean;
  teleconsulta?: boolean;
}

/**
 * Request para inserir agendamento
 */
interface AgendamentoInserirRequest {
  paciente: CodigoBaseRequest;
  usuario: CodigoBaseRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
  tipoAgendamento?: TipoAgendamentoRequest;
  convenio?: CodigoBaseRequest;
  plano?: CodigoBaseRequest;
  localProDoctor?: CodigoBaseRequest;
  procedimentoMedico?: {
    tabela: CodigoBaseRequest;
    codigo: string;
  };
  complemento?: string;
  duracao?: number; // minutos
  naoEnviarMsgConfirmacao?: boolean;
  encaixe?: boolean;
  atualizaContatoPaciente?: boolean;
  telefone?: {
    ddd?: string;
    numero?: string;
    tipo?: CodigoBaseRequest;
  };
  email?: string;
}

/**
 * Request para alterar agendamento
 */
interface AgendamentoAlterarRequest {
  agendamento: {
    localProDoctor?: CodigoBaseRequest;
    usuario: CodigoBaseRequest;
    data: string;
    hora: string;
    paciente?: CodigoBaseRequest;
    tipoAgendamento?: TipoAgendamentoRequest;
    convenio?: CodigoBaseRequest;
    procedimentoMedico?: {
      tabela: CodigoBaseRequest;
      codigo: string;
    };
    complemento?: string;
  };
  agendamentoOrigem: {
    localProDoctor?: CodigoBaseRequest;
    usuario: CodigoBaseRequest;
    data: string;
    hora: string;
  };
  agendamentoAlertas?: {
    suprimirAlertaAlteracao?: boolean;
  };
}

/**
 * Request para desmarcar agendamento
 */
interface AgendamentoDesmarcarRequest {
  agendamento: CodigoBaseRequest;
  motivo?: string;
}

/**
 * Request para excluir agendamento
 */
interface AgendamentoApagarRequest {
  localProDoctor?: CodigoBaseRequest;
  usuario: CodigoBaseRequest;
  data: string;
  hora: string;
}

/**
 * Request para alterar status do agendamento
 */
interface AgendamentoAlterarStatusRequest {
  agendamento: CodigoBaseRequest;
  estadoAgendaConsulta: {
    confirmado?: boolean;
    compareceu?: boolean;
    atrasado?: boolean;
    atendimento?: boolean;
    atendido?: boolean;
    faltou?: boolean;
    horaCompareceu?: string;
    horaAtendimento?: string;
    horaAtendido?: string;
  };
}

/**
 * Request para buscar horários disponíveis
 */
interface HorariosDisponiveisRequest {
  usuario: CodigoBaseRequest;
  periodo: PeriodoRequest;
  procedimento?: {
    tabela: CodigoBaseRequest;
    codigo: string;
  };
  localProDoctor?: CodigoBaseRequest;
  convenio?: CodigoBaseRequest;
  plano?: CodigoBaseRequest;
  turnos?: {
    manha?: boolean;
    tarde?: boolean;
    noite?: boolean;
  };
  tipoAgendamento?: TipoAgendamentoRequest;
}

/**
 * Request para buscar por status
 */
interface AgendamentoPorStatusRequest {
  periodo: PeriodoRequest;
  usuarios?: CodigoBaseRequest[];
  locaisProDoctor?: CodigoBaseRequest[];
  estadoAgendaConsulta?: {
    confirmado?: boolean;
    enviadoMSG?: boolean;
    confirmadoMSG?: boolean;
    compareceu?: boolean;
    atendimento?: boolean;
    atrasado?: boolean;
    atendido?: boolean;
    faltou?: boolean;
    operador?: number; // 0: E, 1: OU
  };
  tipoAgendamento?: TipoAgendamentoRequest & { operador?: number };
}

// ========== VIEW MODELS ==========

/**
 * Estado do agendamento
 */
interface EstadoAgendaConsultaViewModel {
  confirmado?: boolean;
  enviadoMSG?: boolean;
  confirmadoMSG?: boolean;
  compareceu?: boolean;
  atrasado?: boolean;
  atendimento?: boolean;
  atendido?: boolean;
  faltou?: boolean;
  desmarcado?: boolean;
  horaCompareceu?: string;
  horaAtendimento?: string;
  horaAtendido?: string;
}

/**
 * Tipo de agendamento ViewModel
 */
interface TipoAgendamentoViewModel {
  consulta?: boolean;
  retorno?: boolean;
  exame?: boolean;
  cirurgia?: boolean;
  compromisso?: boolean;
  teleconsulta?: boolean;
}

/**
 * Agendamento básico para listagem
 */
interface AgendamentoBasicoViewModel {
  codigo: number;
  data: string;
  hora: string;
  duracao?: number;
  paciente?: {
    codigo: number;
    nome: string;
  };
  usuario?: {
    codigo: number;
    nome: string;
    especialidade?: {
      codigo: number;
      nome: string;
    };
  };
  convenio?: {
    codigo: number;
    nome: string;
  };
  localProDoctor?: {
    codigo: number;
    nome: string;
  };
  procedimentoMedico?: {
    codigo: string;
    nome: string;
    tabela?: {
      codigo: number;
      nome: string;
    };
  };
  tipoAgendamento?: TipoAgendamentoViewModel;
  estadoAgendaConsulta?: EstadoAgendaConsultaViewModel;
  complemento?: string;
  encaixe?: boolean;
}

/**
 * Agendamento completo para consulta
 */
interface AgendamentoConsultaViewModel extends AgendamentoBasicoViewModel {
  telefone?: {
    ddd?: string;
    numero?: string;
    tipo?: {
      codigo?: number;
      descricao?: string;
    };
  };
  email?: string;
  plano?: string;
  dataInsercao?: string;
  dataAlteracao?: string;
  orientacaoUsuario?: string;
  orientacaoConvenio?: string;
  orientacaoProcedimento?: string;
}

/**
 * Agendamento detalhado
 */
interface AgendamentoDetalhadoViewModel extends AgendamentoConsultaViewModel {
  pacienteCompleto?: {
    codigo?: number;
    nome?: string;
    dataNascimento?: string;
    cpf?: string;
    telefone1?: any;
    telefone2?: any;
    telefone3?: any;
    telefone4?: any;
    correioEletronico?: string;
  };
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
  localProDoctor?: {
    codigo: number;
    nome: string;
  };
  agendamentos: AgendamentoConsultaViewModel[];
  totalAgendamentos: number;
}

/**
 * Horário disponível
 */
interface HorarioDisponivelViewModel {
  dataHora: string; // DD/MM/YYYY HH:mm
  disponivel: boolean;
  motivoIndisponibilidade?: string;
  duracao?: number;
}

// ========== RESPONSES ==========

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
 * Response de busca de agendamentos do paciente
 */
interface PDResponseAgendamentosViewModel {
  payload: {
    agendamentos: AgendamentoConsultaViewModel[];
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

/**
 * Response de busca por status
 */
interface PDResponseAgendaBuscarPorStatusViewModel {
  payload: {
    agendamentos: AgendamentoConsultaViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response de alteração de status
 */
interface PDResponseAlterarStatusAgendamentoViewModel {
  payload: {
    agendamento: {
      codigo: number;
      estadoAgendaConsulta: EstadoAgendaConsultaViewModel;
    };
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Turnos para busca
 */
interface TurnosRequest {
  manha?: boolean;
  tarde?: boolean;
  noite?: boolean;
}

// ========== EXPORTS ==========

export {
  // Requests
  AgendamentoListarPorUsuarioRequest,
  AgendamentoBuscarRequest,
  AgendamentoDetalharRequest,
  AgendamentoInserirRequest,
  AgendamentoAlterarRequest,
  AgendamentoDesmarcarRequest,
  AgendamentoApagarRequest,
  AgendamentoAlterarStatusRequest,
  AgendamentoPorStatusRequest,
  HorariosDisponiveisRequest,
  TipoAgendamentoRequest,
  TurnosRequest,
  // ViewModels
  EstadoAgendaConsultaViewModel,
  TipoAgendamentoViewModel,
  AgendamentoBasicoViewModel,
  AgendamentoConsultaViewModel,
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
  PDResponseAgendaBuscarPorStatusViewModel,
  PDResponseAlterarStatusAgendamentoViewModel,
};
