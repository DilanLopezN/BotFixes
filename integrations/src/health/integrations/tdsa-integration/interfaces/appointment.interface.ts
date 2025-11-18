interface TdsaAppointmentValueRequest {
  IdEmpresa: number;
  IdConvenio: number;
  IdPlano: number;
  IdEspecialidade?: number;
  IdProfissional?: number;
  IdProcedimento: number;
}

interface TdsaCreateScheduleRequest {
  IdUnidade: number;
  IdConvenio: number;
  IdEspecialidade: number;
  IdPlano: number;
  IdProfissional: number;
  IdProfissionalHorario: number;
  IdProcedimento: number;
  IdPaciente: number;
  IdAgendamento: number;
  MatriculaConveniado?: string;
  Observacao?: string;
  Data: string;
  Telemedicina?: boolean;
  EnviaEmailSms?: boolean;
}

interface TdsaListAvailableSchedulesRequest {
  IdUnidade: number;
  IdConvenio: number;
  IdEspecialidade: number;
  IdPlano?: number;
  IdProfissional?: number;
  IdProcedimento: number;
  Data?: string;
  IdPaciente?: number;
  SexoPaciente?: 'M' | 'F';
  IdadePaciente?: number;
  Telemedicina?: boolean;
}

interface TdsaListAvailableSchedules {
  DataHora: string;
  IdProfissional: number;
  IdProfissionalHorario: number;
  ProfissionalNome: string;
  IdUnidade?: number; // dado ficticio para manipular objeto
  Tratamento: string;
  ProfissionalCodigoConselho: string;
  ProfissionalSiglaTipoConselhoProfissional: string;
  ProfissionalSiglaEstadoConselhoProfissional: string;
}

interface TdsaLockScheduleRequest {
  IdUnidade: number;
  IdConvenio: number;
  IdEspecialidade: number;
  IdPlano?: number;
  IdProfissional: number;
  IdProfissionalHorario: number;
  IdProcedimento: number;
  IdPaciente: number;
  IdAgendamento?: number;
  MatriculaConveniado?: string;
  Observacao?: string;
  Data: string;
  EnviaEmailSms?: boolean;
  Telemedicina?: boolean;
}

interface TdsaListSchedulesParamsRequest {
  dataInicio?: string;
  dataFim?: string;
  idAgendamento?: number; // se tiver idAgendamento não precisa de filtro de data
}

interface TdsaGuidance {
  PreOrientacao?: string;
  PosOrientacao?: string;
  OrientacaoTecnica?: string;
}
interface TdsaSchedule {
  NomeUnidade: string;
  NomeConvenio: string;
  NomeEspecialidade: string;
  NomePlano: string;
  NomeProfissional: string;
  NomeProcedimento: string;
  Status: number; // 1- agendado, 2- cancelado, 3 - atendido, 4- age. confirmado, 5- faltou
  IdUnidade: number;
  IdConvenio: number;
  IdEspecialidade: number;
  IdPlano: number;
  IdProfissional: number;
  IdProfissionalHorario: number;
  IdProcedimento: number;
  IdPaciente: number;
  IdAgendamento: number;
  Data: string;
  Telemedicina?: boolean;
  LinkTelemedicina?: string;
}

export {
  TdsaAppointmentValueRequest,
  TdsaCreateScheduleRequest,
  TdsaListAvailableSchedulesRequest,
  TdsaListAvailableSchedules,
  TdsaLockScheduleRequest,
  TdsaListSchedulesParamsRequest,
  TdsaSchedule,
  TdsaGuidance,
};
