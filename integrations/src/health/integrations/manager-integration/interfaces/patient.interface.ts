interface ManagerCreatePatient {
  dataNascimento: string;
  email: string;
  nome: string;
  sexo: string;
  menor?: string;
  telefones: {
    telefone: string;
    telefoneNumerico: string;
    preferencial?: boolean;
    tipo: {
      handle: ManagerPatientPhoneType;
      nome: 'Celular' | string;
    };
  }[];
  cpf: string;
}

interface ManagerUpdatePatient {
  dataNascimento: string;
  handle: number;
  protocolo: number;
  email: string;
  nome: string;
  sexo: string;
  menor?: string;
  telefones: {
    telefone: string;
    telefoneNumerico: string;
    preferencial?: boolean;
    tipo: {
      handle: ManagerPatientPhoneType;
      nome: 'Celular' | string;
    };
  }[];
  cpf: string;
}

enum ManagerPatientPhoneType {
  cellPhone = 3,
}

interface ManagerCreatePatienResponse {
  token: string;
  type: string;
}

interface ManagerPatientSchedules {
  paciente: number;
}

interface ManagerPatientSchedulesResponse {
  handle: number;
  data: string;
  situacao: {
    handle: number;
    nome: string;
  };
  convenio: {
    handle: number;
    nome: string;
  };
  servico: {
    handle: number;
    nome: string;
    nomeWeb: string;
    preparoPdf: boolean;
    tipo: string;
    disponivelWeb: boolean;
    hashPreparoPdf: string;
  };
  medico: {
    handle: number;
    nome: string;
    tipo: number;
  };
  especialidade: {
    handle: number;
    nome: string;
    disponivelWeb: boolean;
  };
  unidadeFilial: {
    handle: number;
    nome: string;
    logradouro: string;
    numero: null;
    bairro: string;
    cep: string;
    municipio: string;
    uf: string;
  };
  recurso: {
    handle: number;
    nome: string;
    tipo: number;
  };
  cancelamentoDisponivel: boolean;
  confirmacaoDisponivel: 'INDISPONIVEL' | 'CONFIRMADO' | 'DISPONIVEL';
}

interface ManagerPatientResponse {
  handle: number;
  nome: string;
  protocolo: number;
  nomeSocial?: string;
  dataNascimento: string;
  sexo: string;
  cpf: string;
  rg: string;
  email: string;
  telefones: {
    preferencial: boolean;
    handle: number;
    telefone: string;
    telefoneNumerico: string;
    tipo: {
      handle: number;
      nome: string;
    };
  }[];
}

export {
  ManagerCreatePatient,
  ManagerUpdatePatient,
  ManagerCreatePatienResponse,
  ManagerPatientSchedulesResponse,
  ManagerPatientSchedules,
  ManagerPatientResponse,
  ManagerPatientPhoneType,
};
