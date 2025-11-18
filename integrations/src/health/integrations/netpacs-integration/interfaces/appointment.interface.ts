interface SchedulesResponse {
  idHorario: number;
  idEscala: number;
  idMedico: number;
  nomeMedico: string;
  medicoProvisorio: boolean;
  idSala: number;
  nomeSala: string;
  data: number;
  dataString: string;
  horaInicial: number;
  horaInicialString: string;
  horaFinal: number;
  indisponivel: boolean;
  agrupador: number;
  idProcedimento: number;
  nomeProcedimento: string;
  duracaoProcedimento: number;
  filtroMedicoAgendamentoExterno: boolean;
  contatoPacienteAgendamentoExterno: boolean;
  listIdHorario: number[];
  orientacao: string;
  duracao: number;
  restrito: boolean;
  utilizaAnestesia: boolean;
  utilizaContraste: boolean;
  confirmaHorario: boolean;
  idAtendimentoProcedimento: number;
  accessionNo: string;
  minPreparatorioExame: string;
  idUnidade: number;
}

interface SchedulesRequestParams {
  buscaInteligente: boolean;
  dataBusca: string;
  idConvenio: string;
  idFilial: string;
  idPaciente: string;
  idPlanoConvenio: string;
  listIdProcedimento: string;
  pesoPaciente?: string;
  idadePaciente?: number;
  sexoPaciente?: string;
  idMedico?: string;
}

interface AttendanceResponse {
  idAtendimentoProcedimento: number;
  accessionNo: string;
  nomeSolicitanteWorklist: string;
  status: string;
  titulo: string;
  data: number;
  horaInicial: number;
  dataEntregaLaudo: number;
  idConvenio: number;
  dataEntregaResultado: number;
  protocolo: string;
  idProcedencia: string;
  nomeProcedencia: string;
  guia: string;
  matricula: string;
  validadeMatricula: string;
  indicacaoClinica: string;
  entreguePara: string;
  idAtendimentoProcedimentoLaudo: number;
  idFilial: number;
  nomeFilial: string;
  idUnidade: number;
  nomeUnidade: string;
  idProcedimento: number;
  nomeProcedimento: string;
  idMedicoExecutor: number;
  crmMedicoExecutor: string;
  crmEstadoMedicoExecutor: string;
  nomeMedicoExecutor: string;
  idMedicoSolicitante: number;
  crmMedicoSolicitante: string;
  crmEstadoMedicoSolicitante: string;
  nomeMedicoSolicitante: string;
  idMedicoRevisor: number;
  crmMedicoRevisor: string;
  crmEstadoMedicoRevisor: string;
  nomeMedicoRevisor: string;
  idSituacao: number;
  nomeSituacao: string;
  idSala: number;
  nomeSala: string;
  idPaciente: number;
  nomePaciente: string;
  alturaPaciente: string;
  pesoPaciente: string;
  patId: string;
  sexoPaciente: string;
  dataNascimento: number;
  nomeMae: string;
  cpf: string;
  rg: string;
  telefonePaciente: string;
  telefoneCelularPaciente: string;
  telefoneTrabalhoPaciente: string;
  emailPaciente: string;
  utilizaAnestesia: boolean;
  utilizaContraste: boolean;
  idPrioridadeExame: number;
  nomePrioridadeExame: string;
  idProcedimentoGrupoLaudo: string;
  nomeProcedimentoGrupoLaudo: string;
  identificadorProcedimentoGrupoLaudo: string;
  idModalidade: number;
  chaveModalidade: string;
  descricaoModalidade: string;
  nomeConvenio: string;
  idAtendimentoProcedimentoPai?: number;
}

interface AttendancesRequestParams {
  accessionNo?: string;
  dataFinal: string;
  dataInicial: string;
  idSituacao?: number;
  listIdSituacao?: number[];
  limit: number;
  listAn?: string;
  listPatId?: string;
  listSala?: string;
  page?: number;
  status?: string;
}

interface CancelAttendanceRequest {
  idMotivoSituacao: number;
  observacao?: string;
}

interface UpdateAttendanceStatusRequest {
  idSituacao: number;
}

interface CreateScheduleRequest {
  atendimentoRn?: boolean;
  dataAutorizacaoString?: string;
  envioMensagemOrientacao?: boolean;
  guia?: string;
  encaixe?: boolean;
  guiaOperadora?: string;
  idConvenio: number;
  idPaciente: number;
  idPlanoConvenio: number;
  indicacaoClinica?: string;
  listHorarioDTO: [
    {
      idHorario?: number;
      idProcedimento: number;
      utilizaAnestesia?: boolean;
      utilizaContraste?: boolean;
      dataString?: string;
      duracaoProcedimento?: string;
      horaInicialString?: string;
      idEscala?: string;
      idMedico?: string;
      idSala?: string;
    },
  ];
  matricula?: string;
  pesoPaciente?: string;
  senhaAutorizacao?: string;
  validadeAutorizacaoString?: string;
  validadeMatriculaString?: string;
}

interface CreateScheduleResponse {
  status: string;
  message: string;
}

interface GroupedSchedulesResponseParams {
  buscaInteligente?: boolean;
  dataBusca: string;
  idConvenio: string;
  idEspecialidade?: string;
  idFilial: string;
  idMedico?: string;
  idPaciente: string;
  idPlanoConvenio: string;
  idUnidade?: string;
  listIdProcedimento: string;
  pesoPaciente?: string;
}

interface GetProcedureValueParams {
  idProcedimento: number;
  idPlanoConvenio: number;
  dataString: string;
}

interface GetProcedureValueResponse {
  valorProcedimento: number;
}

interface GroupedSchedulesResponse {
  data: string;
  dataTimeStamp: number;
  unidades: {
    idUnidade: number;
    medicos: {
      idMedico: number;
      nomeMedico: string;
      horarios: {
        idHorario: number;
        horaInicial: string;
        procedimento: string;
        duracao: number;
        diaDaSemana: string;
        sala: string;
        idSala: number;
        horarioTimestamp: number;
      }[];
    }[];
  }[];
}

interface FollowUpAppointmentsResponse {
  idAtendimentoProcedimento: number;
  idConvenio: number;
  idPlanoConvenio: number;
  idProcedimento: number;
  idProcedimentoRetorno: number;
  idSala: number;
  idMedicoExecutor: number;
  dataAgendamento: string;
  prazoDias: number;
  dataLimiteRetorno: string;
  quantidadeLimiteRetorno: number;
  quantidadeRetornoOcupado: number;
  quantidadeRetornoAberto: number;
}

interface FollowUpAppointmentsRequestParams {
  idPaciente: number;
}

export {
  SchedulesResponse,
  SchedulesRequestParams,
  CancelAttendanceRequest,
  AttendanceResponse,
  AttendancesRequestParams,
  UpdateAttendanceStatusRequest,
  CreateScheduleRequest,
  CreateScheduleResponse,
  GroupedSchedulesResponse,
  GroupedSchedulesResponseParams,
  GetProcedureValueParams,
  GetProcedureValueResponse,
  FollowUpAppointmentsResponse,
  FollowUpAppointmentsRequestParams,
};
