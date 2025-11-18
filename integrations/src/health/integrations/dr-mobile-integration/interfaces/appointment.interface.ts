interface DrMobileCancelScheduleResponse {
  retorno: string; // Agendamento cancelado com sucesso!
}

interface DrMobileCancelScheduleParams {
  patientCode: string | number;
  scheduleCode: string;
}

interface DrMobileConfirmScheduleParams {
  codigo_it_agenda: number;
  tpPresencaFalta: 'P';
  cdPaciente: number | string;
  codigo_agenda: number;
}

interface DrMobileCreateSchedule {
  cpf: string;
  codigopaciente: number;
  hospital: string;
  opcaohorario: string;
  celular: string;
  convenio: string;
  plano?: string;
  nascimento: string;
  identity: string;
  sexo: string;
  empresa?: string;
}

interface DrMobileCreateScheduleExam {}

interface DrMobileCreateScheduleResponse {
  sucess: number;
  mensagem: string;
  protocoloagenda: string;
}

interface DrMobileAvailableSchedules {
  cpf: string;
  idade: number;
  sexo: string;
  hospital: string; // CNPJ
  servico: number;
  convenio: number;
  identity: number;
  unidade: number;
  prestador?: number;
  item?: number;
}

interface DrMobileAvailableSchedulesResponse {
  sucess: number;
  mensagem: string;
  menuhorarios: DrMobileAvailableSchedule[];
}

interface DrMobileAvailableSchedule {
  opcao: number;
  horario: string;
  cpf: string;
  itagendaini: number;
  itagendafim: number;
  service: number;
  item: number;
  descricao: string;
  medico: number;
  nmmedico: string;
  diasemana: string;
  id_hospital: string;
  identity: number;
  cdTipMar: string;
}

interface DrMobileListSchedulesParams {
  codigoPaciente?: number;
  tipoAgenda?: 'A' | 'I';
  codigoServico?: number;
  dtInicio: string;
  dtFim: string;
}

interface DrMobileScheduleConfirmation {
  cdPaciente: number;
  nmPaciente: string;
  cpf: string;
  nascimento: string;
  sexo: string;
  mae: string;
  ddd: string;
  telefone: string;
  dddCelular: string;
  celular: string;
  email: string;
  horarios: {
    codigo_agenda: number;
    cd_it_agenda: number;
    nr_ddd_celular: string;
    nr_celular: string;
    nr_ddd_fone: null;
    nr_fone: null;
    dt_agenda: string;
    hr_agenda: string;
    cd_tipo_marcacao: number;
    tipo_marcacao: string;
    codigo_servico: number;
    desc_servico: string;
    presenca_falta: 'P' | 'F';
    dh_presenca_falta: string;
    item_agendamento: {
      codigo_item: number;
      descricao_item: string;
      tipo_item: string;
    };
    convenio: {
      codigo_convenio: number;
      nome_convenio: string;
      sn_ativo: string;
      tipo_convenio: string;
    };
    prestador: {
      cdPrestador: number;
      nmPrestador: string;
      multiEmpresa: {
        cdMultiEmpresa: number;
        dsMultiEmpresa: string;
        cdCgc: string;
      };
      especialidades: any;
    };
    unidade: {
      cd_unidade_atendimento: number;
      ds_unidade_atendimento: string;
    };
  }[];
}

export {
  DrMobileCreateSchedule,
  DrMobileCreateScheduleResponse,
  DrMobileAvailableSchedules,
  DrMobileAvailableSchedule,
  DrMobileCreateScheduleExam,
  DrMobileCancelScheduleResponse,
  DrMobileCancelScheduleParams,
  DrMobileAvailableSchedulesResponse,
  DrMobileConfirmScheduleParams,
  DrMobileListSchedulesParams,
  DrMobileScheduleConfirmation,
};
