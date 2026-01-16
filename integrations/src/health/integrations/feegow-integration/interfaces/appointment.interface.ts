interface FeegowCreateSchedule {
  local_id: number;
  paciente_id: number;
  profissional_id?: number;
  especialidade_id?: number;
  procedimento_id?: number;
  data: string;
  horario: string;
  valor: number;
  plano: number;
  convenio_id?: number;
  convenio_plano_id?: number;
  canal_id?: number;
  tabela_id?: number;
  notas?: string;
  celular?: string;
  telefone?: string;
  email?: string;
  sys_user?: number;
}

interface FeegowCreateScheduleResponse {
  agendamento_id: number;
}

interface FeegowCancelSchedule {
  agendamento_id: number;
  motivo_id: number;
  obs?: string;
}

interface FeegowConfirmSchedule {
  AgendamentoID: number;
  StatusID: 7;
  Obs: string;
}

interface FeegowConfirmScheduleResponse {
  msg: string;
}

interface FeegowAvailableSchedules {
  tipo: string;
  especialidade_id?: number;
  procedimento_id?: number;
  data_start: string;
  data_end: string;
  unidade_id: number;
  convenio_id?: number;
  profissional_id?: number;
}

interface FeegowAvailableSchedulesResponse {
  profissional_id: {
    [doctorId: string]: {
      local_id: {
        [localId: string]: {
          [availableScheduleDay: string]: string[];
        };
      };
    };
  };
}

interface FeegowPatientSchedules {
  agendamento_id?: number;
  data_start?: string;
  data_end?: string;
  profissional_id?: number;
  paciente_id?: number;
  unidade_id?: number;
  especialidade_id?: number;
  procedimento_id?: number;
  canal_id?: number;
  local_id?: number;
  status_id?: number;
}

interface FeegowScheduleResponse {
  agendamento_id: number;
  data: string;
  horario: string;
  paciente_id: number;
  procedimento_id: number;
  status_id: number;
  local_id: number;
  profissional_id: number;
  unidade_id: number;
  nome_fantasia: string;
  especialidade_id: number;
  convenio_id: number;
  encaixe?: boolean;
  telemedicina?: boolean;
}

interface FeegowReschedule {
  agendamento_id: number;
  motivo_id: 1;
  data: string;
  horario: string;
  obs?: string;
}

export {
  FeegowCreateSchedule,
  FeegowCreateScheduleResponse,
  FeegowConfirmSchedule,
  FeegowCancelSchedule,
  FeegowConfirmScheduleResponse,
  FeegowAvailableSchedules,
  FeegowAvailableSchedulesResponse,
  FeegowPatientSchedules,
  FeegowScheduleResponse,
  FeegowReschedule,
};
