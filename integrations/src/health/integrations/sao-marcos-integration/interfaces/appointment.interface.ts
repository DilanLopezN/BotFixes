interface SaoMarcosAppointmentValueRequest {}

interface SaoMarcosListAvailableSchedules {}

interface SaoMarcosCancelSchedule {
  codigo: string;
}

interface SaoMarcosCancelScheduleResponse {
  codigo: string;
}

interface SaoMarcosCreateSchedule {
  codigoPaciente: string;
  horario: {
    codigo: string;
    convenio: {
      codigo: string;
      codigoPlano: string;
    };
    dataHoraAgendamento: string;
    procedimento: {
      codigo: string;
      codigoEspecialidade: string;
    };
  };
}

interface SaoMarcosReschedule {
  // agendamento que será cancelado
  codigoAtendimento: string;
  codigoPaciente: string;
  horario: {
    codigo: string;
    convenio: {
      codigo: string;
      codigoPlano: string;
    };
    dataHoraAgendamento: string;
    procedimento: {
      codigo: string;
      codigoEspecialidade: string;
    };
  };
}

interface SaoMarcosCreateScheduleResponse {
  codigo: string;
}

interface SaoMarcosRescheduleResponse {
  codigo: string;
}

interface SaoMarcosAvailableSchedules {
  procedimento: {
    codigo: string;
    codigoEspecialidade: string;
    tipoEspecialidade: string;
  };
  codigoPaciente?: string;
  generoPaciente?: string;
  idadePaciente?: string;
  medicos?: {
    codigo: string;
  }[];
  convenio: {
    codigo: string;
    codigoPlano: string;
    codigoSubplano?: string;
  };
  dataHoraInicio: string;
  dataHoraFim: string;
  horaDiaInicio: string;
  horaDiaFim: string;
}

interface SaoMarcosAvailableSchedulesResponse {
  codigo: string;
  dataHoraAgendamento: string;
  duracao: string;
  idProcedimento: string;
  idUnidade: string;
  idMedico: string;
  idConvenio: string;
  aviso?: string;
}

interface SaoMarcoListSchedules {
  dataInicioBusca: string;
  dataFimBusca: string;
  status: string;
  codigoPaciente?: string;
}

interface SaoMarcoListSchedulesResponse {
  codigoAtendimento?: string;
  codigoHorario: string;
  status: string;
  // 0	CANCELADO
  // 1	CONFIRMADO
  // 2	AGENDADO
  // 3	AG. CONFIRMADO
  // 4	AG. CANCELADO
  // 5	RET. CANCELADO
  // 6	RET. CONFIRMADO
  // 7	RET. CIR. CANCEL.
  // 8	RET. CIR. CONFIRMADO
  // 10	RET. AGEND. CANCEL.
  // 11	RET. AGEND. CONF.
  // 12	CONF. ENFSR.
  // 13	AG. ENFSR.
  // 14	AG. CONF. ENFER.
  // 15	ENC. ODONTO
  // 16	RET. P/ PARECER
  statusDescricao?: string;
  dataHorario: string;
  tipoAgendamento: string;
  medico: {
    codigo: string;
    nome: string;
  };
  procedimento: {
    codigo: string;
    nome: string;
  };
  especialidade: {
    codigo: string;
    nome: string;
  };
  convenio: {
    codigo: string;
    nome: string;
  };
  plano: {
    codigo?: string;
    nome?: string;
  };
  paciente: {
    telefone?: string;
    celular?: string;
    codigoPaciente: string;
    nome: string;
    email?: string;
  };
  idMotivoCancela?: number;
  motivoCancela?: string;
}

interface SaoMarcosConfirmSchedulePayload {
  externalId: string;
}

interface SaoMarcosConfirmScheduleResponse {
  status: number;
  localDateTime: string;
  titulo: string;
  campos: CamposSaoMarcosConfirmScheduleResponse[];
}

interface CamposSaoMarcosConfirmScheduleResponse {
  nome: string;
  mensagem: string;
}

export {
  SaoMarcosAppointmentValueRequest,
  SaoMarcosListAvailableSchedules,
  SaoMarcosCancelSchedule,
  SaoMarcosCreateSchedule,
  SaoMarcosCreateScheduleResponse,
  SaoMarcosAvailableSchedules,
  SaoMarcosAvailableSchedulesResponse,
  SaoMarcosRescheduleResponse,
  SaoMarcosReschedule,
  SaoMarcoListSchedules,
  SaoMarcoListSchedulesResponse,
  SaoMarcosConfirmSchedulePayload,
  SaoMarcosConfirmScheduleResponse,
  SaoMarcosCancelScheduleResponse,
};
