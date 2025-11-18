interface ClinuxListAvailableSchedulesResponse {
  cod: string;
  dia: string;
  final: string;
  hora: string;
  nome: string;
  semana: number;
}

interface ClinuxListAvailableSchedulesResponseV2 {
  id: number;
  date: string;
  enddate: string;
  provider: number;
  facility: number;
}

interface ClinuxListAvailableSchedulesParamsRequest {
  cd_horario?: string;
  cd_atendimento?: number;
  cd_paciente?: number;
  cd_empresa: number;
  cd_plano: number;
  cd_subplano?: number;
  dt_data: string;
  dt_hora: string;
  dt_hora_fim: string;
  sn_consulta: boolean;
  sl_exame?: string;
  ds_plano?: string;
  js_exame: string;
  token?: string;
}

interface ClinuxListAvailableSchedulesParamsRequestV2 {
  startTime?: string;
  endTime?: string;
  provider?: string;
  patient?: string;
  procedure?: string;
  modality?: string;
  site?: string;
  covenant?: string;
  token?: string;
}

interface ClinuxScheduleJsExame {
  cd_modalidade: number;
  cd_procedimento: number;
  ds_procedimento?: string;
  cd_medico: number;
  cd_plano: number;
  cd_subplano: number;
  cd_empresa: number;
  nr_tempo: string;
  nr_tempo_total?: string;
  nr_valor?: string;
  sn_especial: boolean;
  sn_preparo: boolean;
  nr_quantidade: number;
}

interface ClinuxCreateScheduleParamsRequest {
  cd_horario: number | string;
  cd_atendimento: number;
  cd_paciente: number;
  cd_empresa: number;
  cd_plano: number;
  cd_subplano: number;
  dt_data: string;
  dt_hora: string;
  dt_hora_fim?: string;
  sn_consulta: boolean;
  sl_exame?: string;
  cd_medico?: number;
  ds_plano?: string;
  js_exame: string;
}

interface ClinuxCreateScheduleResponse {
  cd_atendimento: number;
}

interface ClinuxListPatientSchedulesResponse {
  cd_atendimento: number;
  cd_modalidade: number;
  cd_paciente: number;
  cd_procedimento: string;
  ds_empresa: string;
  ds_modalidade: string;
  ds_paciente: string;
  ds_status: 'MARCADO' | 'CANCELADO';
  dt_data: string;
  dt_hora: string;
  dt_hora_chegada: string;
}

interface ClinuxListPatientSchedulesParamsRequest {
  cd_paciente: number;
}

interface ClinuxListPatientAttendanceParamsRequest {
  cd_paciente: number;
}

interface ClinuxListPatientAttendanceParamsResponse {
  cd_atendimento: number;
  cd_paciente: number;
  cd_lancamento: number;
  nr_controle: number;
  ds_paciente: string;
  cd_exame: string;
  nr_laudo: number;
  sn_laudar: boolean;
  sn_video: boolean;
  sn_assinado: boolean;
  sn_imagem: boolean;
  sn_filme: boolean;
  sn_particular: boolean;
  dt_data: string;
  sn_captura: boolean;
  cd_modalidade: number;
  ds_medico: string;
  ds_modalidade: string;
  ds_procedimento: string;
}

interface ClinuxConfirmScheduleParamsRequest {
  cd_atendimento: number;
  cd_paciente: number;
}

interface ClinuxConfirmScheduleResponse {
  cd_atendimento: number;
  dt_hora: string;
}

interface ClinuxCancelScheduleParamsRequest {
  cd_atendimento: number;
  cd_paciente: number;
}

interface ClinuxCancelScheduleResponse {
  cd_atendimento: number;
}

export {
  ClinuxListAvailableSchedulesResponse,
  ClinuxListAvailableSchedulesParamsRequest,
  ClinuxCreateScheduleParamsRequest,
  ClinuxCreateScheduleResponse,
  ClinuxListPatientSchedulesParamsRequest,
  ClinuxListPatientSchedulesResponse,
  ClinuxConfirmScheduleResponse,
  ClinuxConfirmScheduleParamsRequest,
  ClinuxCancelScheduleParamsRequest,
  ClinuxCancelScheduleResponse,
  ClinuxScheduleJsExame,
  ClinuxListAvailableSchedulesParamsRequestV2,
  ClinuxListAvailableSchedulesResponseV2,
  ClinuxListPatientAttendanceParamsRequest,
  ClinuxListPatientAttendanceParamsResponse,
};
