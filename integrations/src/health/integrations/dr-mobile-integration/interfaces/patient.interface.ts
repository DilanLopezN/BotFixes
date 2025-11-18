interface DrMobilePatient {
  cdPaciente: number;
  nmPaciente: string;
  nrCpf: string;
  dtNascimento: string;
  tpSexo: string;
  carteira?: {
    convenio: {
      codigo_convenio: number;
      nome_convenio: string;
      sn_ativo: string;
      tipo_convenio: string;
    };
    plano: {
      codigo_plano: number;
      nome_plano: string;
    };
    subPlano: {
      codigo_subplano: number;
      nome_subplano: string;
    };
    validade: string;
    carteira_ativa: string;
    ultima_carteira_utilizada: string;
  }[];
  nmMae: string;
}

interface DrMobileCreatePatient {
  nome: string;
  nascimento: string;
  nrCpf: string;
  tpsexo: string;
}

interface DrMobileCreatePatienResponse {}

interface DrMobileGetPatientRequest {
  cpf: string;
}

interface DrMobilePatientSchedules {
  codigoPaciente: number;
  dias?: number;
  tipoAgenda?: string;
}

interface DrMobilePatientSchedule {
  cd_it_agenda_central: string;
  hr_agenda: string;
  cd_tipo_marcacao: string;
  codigo_servico: string;
  desc_servico: string;
  item_agendamento: {
    codigo_item: string;
    tipo_item: string;
    descricao_item: string;
  };
  convenio: {
    codigo_convenio: string;
    nome_convenio: string;
    sn_ativo: string;
    tipo_convenio: string;
  };
  prestador: {
    cdPrestador: string;
    nmPrestador: string;
    multiEmpresa: {
      cdMultiEmpresa: string;
      dsMultiEmpresa: string;
      cdCgc: string;
    };
  };
}

interface DrMobilePatientSchedulesResponse extends Array<DrMobilePatientSchedule> {}
interface DrMobilePatientSchedulesAxiosResponse {
  data: DrMobilePatientSchedule[];
}

export {
  DrMobileCreatePatienResponse,
  DrMobileCreatePatient,
  DrMobilePatientSchedulesResponse,
  DrMobilePatient,
  DrMobileGetPatientRequest,
  DrMobilePatientSchedules,
  DrMobilePatientSchedule,
  DrMobilePatientSchedulesAxiosResponse,
};
