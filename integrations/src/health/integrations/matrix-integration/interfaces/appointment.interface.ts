interface MatrixAvailableSchedules {
  dataHora_inicio: string;
  dataHora_fim: string;
  paciente_id: string;
  peso: string;
  altura: string;
  procedimentos: {
    procedimento_id: string;
    codigoRegiaoColeta?: string;
  }[];
  procedimentosSelecionados?: {
    procedimento_id?: string;
    codigoRegiaoColeta?: string;
    horarios?: {
      horario_id?: string;
      sala_id?: string;
      responsavel_id?: string;
      dataHora?: string;
      duracao?: string;
    }[];
  }[];
  convenio_id: string;
  plano_id: string;
  setor_id: string;
  responsavel_id: string;
  unidade_id: string;
}

interface MatrixAvailableSchedulesResponse {
  procedimentos: {
    procedimento_id: string;
    codigoRegiaoColeta: string;
    tempoExecucao: string;
    horarios: {
      horario_id: string;
      sala_id: string;
      sala_nome: string;
      responsavel_id: string;
      responsavel_nome: string;
      dataHora: string;
      duracao: string;
      unidade_id: string;
      unidade_nome: string;
    }[];
  }[];
}

interface MatrixCreateSchedules {
  horario_id?: string;
  consulta_id?: string;
  convenio_id?: string;
  plano_id?: string;
  matricula?: string;
  setor_id?: string;
  procedimento_id?: string;
  codigoRegiaoColeta?: string;
  responsavel_id?: string;
  sala_id?: string;
  unidade_id?: string;
  paciente_id?: string;
  codigo_pre_pedido?: string;
  peso?: string;
  altura?: string;
  questionarios?: {
    codigo?: string;
    resposta?: string;
  }[];
}

interface MatrixBlockSchedule {
  horario_id: string;
  sala_id: string;
  responsavel_id: string;
  dataHora: string;
  duracao: string;
  procedimento_ID: string;
  codigoRegiaoColeta: string;
  paciente_id: string;
}

interface MatrixBlockScheduleResponse {
  id_consulta: string;
}

interface MatrixCreateScheduleResponse {
  agendamentos: {
    codigo_pre_pedido: string;
    consulta_id: string;
  }[];
}

interface MatrixCancelScheduleParams {
  consulta_id: string;
  codigo_pre_pedido: string;
}

interface MatrixConfirmScheduleParams {
  consulta_id: string;
  codigo_pre_pedido: string;
}

export {
  MatrixAvailableSchedules,
  MatrixAvailableSchedulesResponse,
  MatrixCreateSchedules,
  MatrixCreateScheduleResponse,
  MatrixBlockSchedule,
  MatrixBlockScheduleResponse,
  MatrixCancelScheduleParams,
  MatrixConfirmScheduleParams,
};
