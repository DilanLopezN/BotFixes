// ========== SCHEDULE INTERFACES ==========
// Aligned with ProDoctor official API swagger

import { CodeRequest, PeriodRequest } from './base.interface';
import { PhoneRequest } from './patient.interface';

// ========== ENUMS ==========

/**
 * Appointment type enum
 */
export enum AppointmentTypeEnum {
  CONSULTATION = 'consulta',
  RETURN = 'retorno',
  EXAM = 'exame',
  SURGERY = 'cirurgia',
  COMMITMENT = 'compromisso',
  TELECONSULTATION = 'teleconsulta',
}

// ========== BASE REQUESTS ==========

/**
 * Patient in appointment request
 * Aligned with PacienteAgendamentoRequest from swagger
 */
export interface AppointmentPatientRequest {
  codigo?: number;
  nome?: string;
}

/**
 * Medical procedure in appointment request
 * Aligned with ProcedimentoMedicoAgendamentoRequest from swagger
 */
export interface AppointmentProcedureRequest {
  tabela?: CodeRequest;
  codigo?: string;
}

/**
 * Appointment state request
 * Aligned with EstadoAgendaConsultaRequest from swagger
 */
export interface AppointmentStateRequest {
  confirmado?: boolean;
  compareceu?: boolean;
  atrasado?: boolean;
  atendimento?: boolean;
  atendido?: boolean;
  faltou?: boolean;
}

/**
 * Appointment type request
 * Aligned with TipoAgendamentoRequest from swagger
 */
export interface AppointmentTypeRequest {
  consulta?: boolean;
  retorno?: boolean;
  exame?: boolean;
  cirurgia?: boolean;
  compromisso?: boolean;
  teleconsulta?: boolean;
}

/**
 * Surgery data for appointment
 * Aligned with AgendamentoCirurgiaRequest from swagger
 */
export interface AppointmentSurgeryRequest {
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
    acomodacao?: CodeRequest;
    marcou?: string;
    data?: string;
    hora?: string;
  };
  auxiliares?: string;
}

/**
 * Appointment alerts request
 * Aligned with AgendamentoAlertasRequest from swagger
 */
export interface AppointmentAlertsRequest {
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
 * Shifts request for available schedules
 * Aligned with TurnosRequest from swagger
 */
export interface ShiftsRequest {
  madrugada?: boolean; // 00:00 - 06:00
  manha?: boolean; // 06:00 - 12:00
  tarde?: boolean; // 12:00 - 18:00
  noite?: boolean; // 18:00 - 00:00
}

/**
 * Days of week request
 * Aligned with DiasNaSemanaRequest from swagger
 */
export interface WeekDaysRequest {
  domingo?: boolean;
  segunda?: boolean;
  terca?: boolean;
  quarta?: boolean;
  quinta?: boolean;
  sexta?: boolean;
  sabado?: boolean;
}

/**
 * Appointment identification request
 * Used to identify a specific appointment
 * Aligned with AgendamentoIDRequest from swagger
 */
export interface AppointmentIdentificationRequest {
  localProDoctor?: CodeRequest;
  usuario: CodeRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
}

/**
 * Detailed appointment data request
 * Used inside insert and update requests
 * Aligned with AgendamentoDetalhadoRequest from swagger
 */
export interface AppointmentDetailedRequest {
  localProDoctor?: CodeRequest;
  usuario: CodeRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
  naoEnviarMsgConfirmacao?: boolean;
  complemento?: string;
  encaixe?: boolean;
  tabela?: CodeRequest;
  estadoAgendaConsulta?: AppointmentStateRequest;
  paciente: AppointmentPatientRequest;
  tipoAgendamento?: AppointmentTypeRequest;
  convenio?: CodeRequest;
  telefone?: PhoneRequest;
  telefone2?: PhoneRequest;
  telefone3?: PhoneRequest;
  telefone4?: PhoneRequest;
  email?: string;
  procedimentoMedico?: AppointmentProcedureRequest;
  agendamentoCirurgia?: AppointmentSurgeryRequest;
  orientacaoUsuario?: string;
  orientacaoConvenio?: string;
  orientacaoProcedimento?: string;
}

// ========== MAIN REQUESTS ==========

/**
 * List appointments by user request
 * Endpoint: POST /api/v1/Agenda/Listar
 * Aligned with AgendamentoListarPorUsuarioRequest from swagger
 */
export interface ListAppointmentsByUserRequest {
  usuario: CodeRequest;
  data: string; // DD/MM/YYYY
  localProDoctor?: CodeRequest;
}

/**
 * Search patient appointments request
 * Endpoint: POST /api/v1/Agenda/Buscar
 * Aligned with AgendamentoPacienteRequest from swagger
 */
export interface SearchPatientAppointmentsRequest {
  quantidade?: number; // 1-5000, default 5000
  periodo?: PeriodRequest;
  paciente: AppointmentPatientRequest;
  localProDoctor?: CodeRequest;
}

/**
 * Get appointment details request
 * Endpoint: GET /api/v1/Agenda/Detalhar/{codigo}
 */
export interface GetAppointmentDetailsRequest {
  codigo: number;
}

/**
 * Insert appointment request
 * Endpoint: POST /api/v1/Agenda/Inserir
 * Aligned with AgendamentoInserirRequest from swagger
 */
export interface InsertAppointmentRequest {
  agendamento: AppointmentDetailedRequest;
  agendamentoAlertas?: AppointmentAlertsRequest;
  atualizaContatoPaciente?: boolean;
}

/**
 * Update appointment request
 * Endpoint: PUT /api/v1/Agenda/Alterar
 * Aligned with AgendamentoAlterarRequest from swagger
 */
export interface UpdateAppointmentRequest {
  agendamento: AppointmentDetailedRequest;
  agendamentoAlertas?: AppointmentAlertsRequest;
  agendamentoOrigem: AppointmentIdentificationRequest;
  atualizaContatoPaciente?: boolean;
}

/**
 * Cancel appointment request
 * Endpoint: PATCH /api/v1/Agenda/Desmarcar
 * Uses AppointmentIdentificationRequest structure
 * Aligned with AgendamentoIDRequest from swagger
 */
export interface CancelAppointmentRequest {
  localProDoctor?: CodeRequest;
  usuario: CodeRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
}

/**
 * Delete appointment request
 * Endpoint: DELETE /api/v1/Agenda/Excluir
 * Aligned with AgendamentoApagarRequest from swagger
 */
export interface DeleteAppointmentRequest {
  localProDoctor?: CodeRequest;
  usuario: CodeRequest;
  data: string; // DD/MM/YYYY
  hora: string; // HH:mm
  agendamentoAlertas?: AppointmentAlertsRequest;
}

/**
 * Update appointment state request
 * Endpoint: PATCH /api/v1/Agenda/AlterarEstado
 * Aligned with AgendamentoAlterarStatusRequest from swagger
 */
export interface UpdateAppointmentStateRequest {
  agendamento: AppointmentIdentificationRequest;
  alterarEstadoAgendaConsulta: {
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
 * Search appointments by status request
 * Endpoint: POST /api/v1/Agenda/BuscarPorStatus
 * Aligned with AgendamentoPorStatusRequest from swagger
 */
export interface SearchAppointmentsByStatusRequest {
  pagina?: number; // 1-2147483647
  quantidade?: number; // 1-5000, default 5000
  periodo?: PeriodRequest;
  localProDoctor?: CodeRequest;
  estadoAgendaConsulta?: AppointmentStateRequest;
  tipoAgendamento?: AppointmentTypeRequest;
  trocaVersao?: {
    versaoInicial?: number;
    versaoFinal?: number;
  };
}

/**
 * Available schedule times request
 * Endpoint: POST /api/v1/Agenda/HorariosDisponiveis
 * Aligned with HorariosDisponiveisRequest from swagger
 */
export interface AvailableTimesRequest {
  usuario: CodeRequest;
  periodo: PeriodRequest;
  localProDoctor?: CodeRequest;
  turnos?: ShiftsRequest;
  diasNaSemana?: WeekDaysRequest;
  especialidade?: {
    codigo: number;
  };
}

// ========== VIEW MODELS ==========

/**
 * Appointment state view model
 * Aligned with EstadoAgendaConsultaViewModel from swagger
 */
export interface AppointmentStateViewModel {
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

/**
 * Appointment type view model
 * Aligned with TipoAgendamentoViewModel from swagger
 */
export interface AppointmentTypeViewModel {
  consulta?: boolean;
  retorno?: boolean;
  exame?: boolean;
  cirurgia?: boolean;
  compromisso?: boolean;
  teleconsulta?: boolean;
}

/**
 * Basic appointment view model
 * Aligned with AgendamentoBasicoViewModel from swagger
 */
export interface AppointmentBasicViewModel {
  codigo?: number;
  data?: string;
  hora?: string;
  duracao?: number;
  paciente?: {
    codigo?: number;
    nome?: string;
  };
  usuario?: {
    codigo?: number;
    nome?: string;
  };
  convenio?: {
    codigo?: number;
    nome?: string;
  };
  localProDoctor?: {
    codigo?: number;
    nome?: string;
  };
  tipoAgendamento?: AppointmentTypeViewModel;
  estadoAgendaConsulta?: AppointmentStateViewModel;
}

/**
 * Consultation appointment view model
 * Aligned with AgendamentoConsultaViewModel from swagger
 */
export interface ConsultationAppointmentViewModel extends AppointmentBasicViewModel {
  encaixe?: boolean;
  complemento?: string;
  telefone?: {
    ddd?: string;
    numero?: string;
    tipo?: {
      codigo?: number;
      descricao?: string;
    };
  };
  email?: string;
  procedimentoMedico?: {
    codigo?: string;
    nome?: string;
    tabela?: {
      codigo?: number;
      nome?: string;
    };
  };
  especialidade?: {
    codigo?: number;
    nome?: string;
  };
  versao?: number;
}

/**
 * Detailed appointment view model
 * Aligned with AgendamentoDetalhadoViewModel from swagger
 */
export interface DetailedAppointmentViewModel extends ConsultationAppointmentViewModel {
  agendamentoCirurgia?: {
    situacao?: {
      codigo?: number;
      nome?: string;
    };
    responsavel?: string;
    local?: string;
    tipoCirurgia?: string;
    centroCirurgico?: {
      codigo?: number;
      nome?: string;
    };
    auxiliares?: string;
  };
  orientacaoUsuario?: string;
  orientacaoConvenio?: string;
  orientacaoProcedimento?: string;
}

/**
 * Day schedule view model
 * Aligned with DiaAgendaConsultaViewModel from swagger
 */
export interface DayScheduleViewModel {
  data?: string;
  agendamentos?: ConsultationAppointmentViewModel[];
}

/**
 * Available time slot view model
 * Aligned with HorarioDisponivelViewModel from swagger
 */
export interface AvailableTimeViewModel {
  data?: string;
  hora?: string;
  diaSemana?: string;
  usuario?: {
    cpf: string;
    codigo?: number;
    nome?: string;
    especialidade?: {
      codigo?: number;
      nome: string;
    };
  };
  localProDoctor?: {
    codigo?: number;
    nome?: string;
  };
}

/**
 * Inserted appointment view model
 * Aligned with AgendamentoAgendaInsertViewModel from swagger
 */
export interface InsertedAppointmentViewModel {
  codigo?: number;
  data?: string;
  hora?: string;
  duracao?: number;
  paciente?: {
    codigo?: number;
    nome?: string;
  };
  usuario?: {
    codigo?: number;
    nome?: string;
  };
  localProDoctor?: {
    codigo?: number;
    nome?: string;
  };
}

// ========== API RESPONSES ==========

/**
 * Day schedule list response
 * Aligned with PDResponseDiaAgendaConsultaViewModel from swagger
 */
export interface DayScheduleResponse {
  payload: {
    agenda: DayScheduleViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Appointments list response
 * Aligned with PDResponseAgendamentosViewModel from swagger
 */
export interface AppointmentsListResponse {
  payload: {
    agendamentos: ConsultationAppointmentViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Appointment details response
 * Aligned with PDResponseAgendamentoDetalhadoViewModel from swagger
 */
export interface AppointmentDetailsResponse {
  payload: {
    agendamento: DetailedAppointmentViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Inserted appointment response
 * Aligned with PDResponseAgendamentoAgendaInsertViewModel from swagger
 */
export interface InsertedAppointmentResponse {
  payload: {
    agendamento: InsertedAppointmentViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Appointment operation response (cancel, delete)
 * Aligned with PDResponseAgendamentoOperacaoViewModel from swagger
 */
export interface AppointmentOperationResponse {
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Search appointments by status response
 * Aligned with PDResponseAgendaBuscarPorStatusViewModel from swagger
 */
export interface AppointmentsByStatusResponse {
  payload: {
    agendamentos: ConsultationAppointmentViewModel[];
    paginaAtual?: number;
    totalPaginas?: number;
    totalRegistros?: number;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Update appointment state response
 * Aligned with PDResponseAlterarStatusAgendamentoViewModel from swagger
 */
export interface UpdateAppointmentStateResponse {
  payload: {
    agendamento: AppointmentBasicViewModel;
  };
  sucesso: boolean;
  mensagens: string[];
}

/**
 * Available times response
 * Aligned with PDResponseHorariosDisponiveisViewModel from swagger
 */
export interface AvailableTimesResponse {
  payload: {
    agendamentos: AvailableTimeViewModel[];
  };
  sucesso: boolean;
  mensagens: string[];
}
