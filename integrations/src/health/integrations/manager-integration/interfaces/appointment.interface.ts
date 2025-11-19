interface ManagerCancelScheduleResponse {
  handle: number;
}

interface ManagerConfirmScheduleResponse {
  handle: number;
}

interface ManagerCreateSchedule {
  celular: string;
  convenio: number;
  data: string;
  duracao: number;
  unidadeFilial: number;
  listaEspera: boolean | string;
  paciente: {
    handle: number;
    email: string;
  };
  recurso: number;
  tipoAgendamento: string;
  imagensAtendimento?: null;
  convenioServico?: number; // valor vem dentro da rota por-especialidade-e-convenio
  medico: number;
  servico: number | null;
  servicos: number;
  plano?: number;
  especialidade?: number;
}

interface ManagerCreateScheduleExam {
  celular: string;
  convenio: number;
  data: string;
  duracao: number;
  unidadeFilial: number | null;
  listaEspera: boolean | string;
  paciente: {
    handle: number;
    email: string;
  };
  recurso: number;
  tipoAgendamento: string;
  imagensAtendimento?: {
    contentType: string;
    foto: string; // base64
    nome: string;
  }[];
  convenioServico?: number;
  medico: number;
  observacao: string;
  servico: number;
  plano?: number;
  servicos: number | null;
}

interface ManagerCreateScheduleResponse {
  handle: number;
  redirecionaPagamento: boolean;
  termoConsentimentoPdf: boolean;
}

interface ManagerAvailableSchedules {
  tipoProcedimento: string;
  tipoServico: string;
  unidadesFiliais: number[];
  convenio: number;
  plano: number;
  servico: number;
  especialidade: number;
  grupoServico?: number;
  dto?: {
    tipoProcedimento: {
      handle: string;
    };
    convenio: {
      handle: number;
    };
    plano?: {
      handle: number;
    };
    servico: {
      handle: number;
    };
    especialidade: {
      handle: number;
    };
    grupoServico?: number;
  };
  medicosResponsaveis?: number[];
  sexo: string;
  peso: number;
  altura: number;
  idade: number;
  dataInicial: string;
  horaInicial: string;
  horaFinal: string;
  handlePaciente: number;
  disponivelWeb: boolean;
  diasSemana?: number[];
  usarCache: boolean;
}

interface ManagerAvailableSchedulesResponse {
  handleUnidadeFilial: number;
  nomeUnidadeFilial: string;
  recursosServico: {
    handle: number;
    handleServico: number;
    handleRecursoMedicoResponsavel: number;
    recursoMedicoResponsavel: string;
    nome: string;
    datasDisponiveisExame: {
      data: string;
      horarios: {
        horario: string;
        recurso: number;
        aparelho: number;
        duracao: number;
        filial: number;
        filialNome: string;
        unidadeFilial: number;
        unidadeFilialNome: string;
        medicoRespEscala: string;
        handleMedicoRespEscala: number;
      }[];
    }[];
  }[][];
}

interface ManagerPatientFollowUpResponse {
  dataHoraAtendimento: string;
  prazoMaximoParaRetorno: string;
  recurso: {
    handle: number;
    nome: string;
    tipo: number;
    medico: number;
    crm: number;
    rqe: number;
    disponivelWeb: boolean;
  };
  unidadeFilial: {
    handle: number;
    nome: string;
  };
  convenio: {
    handle: number;
    nome: string;
  };
  especialidade: {
    handle: number;
    nome: string;
  };
  plano: {
    handle: number;
    nome: string;
  };
  servico: {
    handle: number;
    nome: string;
  };
}

interface ManagerFollowUpSchedulesResponse {
  handle: number;
  handleServico: number;
  handleRecursoMedicoResponsavel: number;
  recursoMedicoResponsavel: string;
  nome: string;
  datasDisponiveisExame: {
    data: string;
    horarios: {
      horario: string;
      recurso: number;
      aparelho: number;
      duracao: number;
      filial: number;
      filialNome: string;
      unidadeFilial: number;
      unidadeFilialNome: string;
      medicoRespEscala: string;
      handleMedicoRespEscala: number;
      handleAtendimento: string;
    }[];
  }[];
}

interface ManagerFollowUpSchedulesRequest {
  usarCache: boolean;
  tipoServico: number;
  disponivelWeb: boolean;
  recurso: number;
  dataFinal: string;
  unidadesFiliais: number[];
  unidadeFilial: number;
  convenio: number;
  plano: number;
  servico: number;
  especialidade: number;
  peso: number;
  altura: number;
  idade: number;
  medicosResponsaveis: string;
  medicoResponsavel: string;
  sexo: string;
  dataInicial: string;
  duracao: number;
  intervalo: number;
}

interface ManagerScheduleValue {
  recurso: number;
  tipoServico: string;
  convenio: number;
  data: string;
}

interface ManagerScheduleValueResponse {
  valorTotal: number;
}

export {
  ManagerConfirmScheduleResponse,
  ManagerCreateSchedule,
  ManagerCreateScheduleResponse,
  ManagerAvailableSchedules,
  ManagerAvailableSchedulesResponse,
  ManagerCancelScheduleResponse,
  ManagerScheduleValue,
  ManagerScheduleValueResponse,
  ManagerCreateScheduleExam,
  ManagerPatientFollowUpResponse,
  ManagerFollowUpSchedulesResponse,
  ManagerFollowUpSchedulesRequest,
};
