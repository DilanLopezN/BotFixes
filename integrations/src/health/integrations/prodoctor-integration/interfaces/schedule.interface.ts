// ========== INTERFACES DE AGENDAMENTO ==========
// Alinhado com swagger oficial da API ProDoctor

import { CodigoBaseRequest, PeriodoRequest } from './base.interface';
import { TelefoneRequest } from './patient.interface';

// ========== REQUESTS BASE ==========

/**
 * Request para paciente no agendamento
 */
interface PacienteAgendamentoRequest {
  codigo?: number;
  nome?: string;
}

/**
 * Request para procedimento médico no agendamento
 */
interface ProcedimentoMedicoAgendamentoRequest {
  tabela?: CodigoBaseRequest;
  codigo?: string;
}

/**
 * Request para estado do agendamento
 */
interface EstadoAgendaConsultaRequest {
  confirmado?: boolean;
  compareceu?: boolean;
  atrasado?: boolean;
  atendimento?: boolean;
  atendido?: boolean;
  faltou?: boolean;
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

// ========== REQUESTS DE AGENDAMENTO ==========

/**
 * Request para listar agendamentos por usuário
 * Endpoint: POST /api/v1/Agenda/Listar
 */
interface AgendamentoListarPorUsuarioRequest {
  usuario: CodigoBaseRequest;
  data: string; // DD/MM/YYYY
  localProDoctor?: CodigoBaseRequest;
}

/**
 * Request para buscar agendamentos de um paciente
 * Endpoint: POST /api/v1/Agenda/Buscar
 */
interface AgendamentoBuscarRequest {
  quantidade?: number; // 1-5000
  periodo?: PeriodoRequest;
  paciente: PacienteAgendamentoRequest;
  localProDoctor?: CodigoBaseRequest;
}

/**
 * Request para detalhar agendamento
 */
interface AgendamentoDetalharRequest {
  codigo: number;
}

/**
 * Dados de identificação de um agendamento (AgendamentoIDRequest)
 * Usado para identificar um agendamento específico
 */
interface AgendamentoIDRequest {
  localProDoctor?: CodigoBaseRequest;
  usuario: CodigoBaseRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
}

/**
 * Dados detalhados de um agendamento (AgendamentoDetalhadoRequest)
 * Usado dentro de AgendamentoInserirRequest e AgendamentoAlterarRequest
 */
interface AgendamentoDetalhadoRequest {
  localProDoctor?: CodigoBaseRequest;
  usuario: CodigoBaseRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
  naoEnviarMsgConfirmacao?: boolean;
  complemento?: string;
  encaixe?: boolean;
  tabela?: CodigoBaseRequest;
  estadoAgendaConsulta?: EstadoAgendaConsultaRequest;
  paciente: PacienteAgendamentoRequest;
  tipoAgendamento?: TipoAgendamentoRequest;
  convenio?: CodigoBaseRequest;
  telefone?: TelefoneRequest;
  telefone2?: TelefoneRequest;
  telefone3?: TelefoneRequest;
  telefone4?: TelefoneRequest;
  email?: string;
  procedimentoMedico?: ProcedimentoMedicoAgendamentoRequest;
  agendamentoCirurgia?: AgendamentoCirurgiaRequest;
  orientacaoUsuario?: string;
  orientacaoConvenio?: string;
  orientacaoProcedimento?: string;
}

/**
 * Dados de cirurgia para o agendamento
 */
interface AgendamentoCirurgiaRequest {
  situacao?: {
    codigo?: number;
  };
  responsavel?: string;
  local?: string;
  tipoCirurgia?: string;
  centroCirurgico?: {
    codigo?: number;
  };
  acomodacaoCirurgia?: {
    acomodacao?: CodigoBaseRequest;
    marcou?: string;
    data?: string;
    hora?: string;
  };
  auxiliares?: string;
}

/**
 * Alertas do agendamento
 */
interface AgendamentoAlertasRequest {
  suprimirAlertaLimiteConsultasPorUsuario?: boolean;
  suprimirAlertaLimiteConsultasPorConvenio?: boolean;
  suprimirAlertaBloqueioRetorno?: boolean;
  suprimirAlertaValidadeCarteirinha?: boolean;
  suprimirAlertaAlteracao?: boolean;
  suprimirAlertaFeriado?: boolean;
  suprimirAlertaPacienteInativo?: boolean;
  suprimirAlertaMensagemEnviadaConfirmada?: boolean;
}

/**
 * Request para inserir agendamento
 * Endpoint: POST /api/v1/Agenda/Inserir
 * IMPORTANTE: Os dados do agendamento ficam dentro da propriedade "agendamento"
 */
interface AgendamentoInserirRequest {
  agendamento: AgendamentoDetalhadoRequest;
  agendamentoAlertas?: AgendamentoAlertasRequest;
  atualizaContatoPaciente?: boolean;
}

/**
 * Request para alterar agendamento
 * Endpoint: PUT /api/v1/Agenda/Alterar
 */
interface AgendamentoAlterarRequest {
  agendamento: AgendamentoDetalhadoRequest;
  agendamentoAlertas?: AgendamentoAlertasRequest;
  agendamentoOrigem: AgendamentoIDRequest;
  atualizaContatoPaciente?: boolean;
}

/**
 * Request para desmarcar agendamento
 * Endpoint: PATCH /api/v1/Agenda/Desmarcar
 * IMPORTANTE: Usa AgendamentoIDRequest para identificar o agendamento
 */
interface AgendamentoDesmarcarRequest {
  localProDoctor?: CodigoBaseRequest;
  usuario: CodigoBaseRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
}

/**
 * Request para excluir agendamento
 * Endpoint: DELETE /api/v1/Agenda/Excluir
 */
interface AgendamentoApagarRequest {
  localProDoctor?: CodigoBaseRequest;
  usuario: CodigoBaseRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
  agendamentoAlertas?: AgendamentoAlertasRequest;
}

/**
 * Request para alterar estado do agendamento
 * Endpoint: PATCH /api/v1/Agenda/AlterarEstado
 */
interface AlterarEstadoAgendaConsultaRequest {
  confirmado?: boolean;
  compareceu?: boolean;
  atrasado?: boolean;
  atendimento?: boolean;
  atendido?: boolean;
  faltou?: boolean;
  horaCompareceu?: string;
  horaAtendimento?: string;
  horaAtendido?: string;
}

interface AgendamentoAlterarStatusRequest {
  estadoAgendaConsulta: AlterarEstadoAgendaConsultaRequest;
  agendamentoID: AgendamentoIDRequest;
}

/**
 * Request para buscar por status
 * Endpoint: POST /api/v1/Agenda/BuscarPorStatus
 */
interface AgendamentoPorStatusRequest {
  pagina?: number;
  quantidade?: number; // 1-5000
  periodo: PeriodoRequest;
  status?: EstadoAgendaConsultaBuscaRequest;
  tipo?: TipoAgendamentoBuscaRequest;
  usuarios?: CodigoBaseRequest[];
  locaisProDoctor?: CodigoBaseRequest[];
  trocaVersao?: TrocaVersaoRequest;
}

interface EstadoAgendaConsultaBuscaRequest {
  confirmado?: boolean;
  enviadoMSG?: boolean;
  confirmadoMSG?: boolean;
  compareceu?: boolean;
  atendimento?: boolean;
  atrasado?: boolean;
  atendido?: boolean;
  faltou?: boolean;
  desmarcado?: boolean;
  operador?: number; // 0: E, 1: OU
}

interface TipoAgendamentoBuscaRequest {
  consulta?: boolean;
  retorno?: boolean;
  exame?: boolean;
  cirurgia?: boolean;
  compromisso?: boolean;
  teleconsulta?: boolean;
  operador?: number; // 0: E, 1: OU
}

interface TrocaVersaoRequest {
  versao?: number;
}

/**
 * Request para buscar horários disponíveis
 * Endpoint: POST /api/v1/Agenda/Livres
 */
interface HorariosDisponiveisRequest {
  quantidade?: number; // 1-5000
  periodo: PeriodoRequest;
  usuario?: CodigoBaseRequest;
  especialidade?: CodigoBaseRequest;
  turnos?: TurnosRequest;
  diasNaSemana?: DiasNaSemanaRequest;
  localProDoctor?: CodigoBaseRequest;
}

/**
 * Turnos para busca
 */
interface TurnosRequest {
  manha?: boolean;
  tarde?: boolean;
  noite?: boolean;
}

/**
 * Dias da semana para busca
 */
interface DiasNaSemanaRequest {
  domingo?: boolean;
  segunda?: boolean;
  terca?: boolean;
  quarta?: boolean;
  quinta?: boolean;
  sexta?: boolean;
  sabado?: boolean;
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
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
  localProDoctor?: {
    codigo: number;
    nome: string;
  };
  usuario?: {
    codigo: number;
    nome: string;
  };
  duracao?: number;
}

/**
 * Agendamento inserido response
 */
interface AgendamentoAgendaInsertViewModel {
  localProDoctor?: {
    codigo: number;
    nome: string;
  };
  usuario?: {
    codigo: number;
    nome: string;
  };
  data: string;
  hora: string;
  paciente?: {
    codigo: number;
    nome: string;
  };
  complemento?: string;
  teleconsulta?: {
    id?: string;
  };
}

// ========== RESPONSES ==========

/**
 * Response de horários disponíveis
 * Endpoint: POST /api/v1/Agenda/Livres
 */
interface ProdoctorResponseAvailabelTimesViewModel {
  payload: {
    agendamentos: HorarioDisponivelViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Response de agendamentos (dia da agenda)
 * Endpoint: POST /api/v1/Agenda/Listar
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
 * Endpoint: POST /api/v1/Agenda/Buscar
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
 * Endpoint: POST /api/v1/Agenda/Detalhar
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
 * Endpoint: POST /api/v1/Agenda/Inserir
 */
interface PDResponseAgendamentoInseridoViewModel {
  payload: {
    agendamento: AgendamentoAgendaInsertViewModel;
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
 * Endpoint: POST /api/v1/Agenda/BuscarPorStatus
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
 * Endpoint: PATCH /api/v1/Agenda/AlterarEstado
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

// ========== EXPORTS ==========

export {
  // Base Requests
  PacienteAgendamentoRequest,
  ProcedimentoMedicoAgendamentoRequest,
  EstadoAgendaConsultaRequest,
  TipoAgendamentoRequest,
  AgendamentoIDRequest,
  AgendamentoDetalhadoRequest,
  AgendamentoCirurgiaRequest,
  AgendamentoAlertasRequest,
  AlterarEstadoAgendaConsultaRequest,
  EstadoAgendaConsultaBuscaRequest,
  TipoAgendamentoBuscaRequest,
  TrocaVersaoRequest,
  TurnosRequest,
  DiasNaSemanaRequest,
  // Main Requests
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
  // ViewModels
  EstadoAgendaConsultaViewModel,
  TipoAgendamentoViewModel,
  AgendamentoBasicoViewModel,
  AgendamentoConsultaViewModel,
  AgendamentoDetalhadoViewModel,
  DiaAgendaConsultaViewModel,
  HorarioDisponivelViewModel,
  AgendamentoAgendaInsertViewModel,
  // Responses
  ProdoctorResponseAvailabelTimesViewModel,
  PDResponseDiaAgendaConsultaViewModel,
  PDResponseAgendamentosViewModel,
  PDResponseAgendamentoDetalhadoViewModel,
  PDResponseAgendamentoInseridoViewModel,
  PDResponseAgendamentoOperacaoViewModel,
  PDResponseAgendaBuscarPorStatusViewModel,
  PDResponseAlterarStatusAgendamentoViewModel,
};
