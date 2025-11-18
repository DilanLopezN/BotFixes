interface SaoMarcosGetPatientResponse {
  codigo: string;
  matricula: string;
  nome: string;
  dataNascimento: string;
  genero: string;
  email: string;
  nomeMae?: string;
  raca?: string;
  cpf: string;
  peso?: number;
  telefones: {
    codigo: string;
    ddd: string;
    ddi: string;
    numero: string;
    tipo: number;
  }[];
}

interface SaoMarcosCreatePatient {
  codigo?: string;
  cpf: string;
  dataNascimento: string;
  email?: string;
  genero: string;
  nome: string;
  nomeMae?: string;
  peso?: number;
  raca?: string;
  telefones: {
    codigo?: string;
    ddd: string;
    ddi?: string;
    numero: string;
    tipo: number;
  }[];
}

interface SaoMarcosUpdatePatient {
  codigo: string;
  cpf: string;
  dataNascimento: string;
  email?: string;
  genero: string;
  nome: string;
  nomeMae?: string;
  peso?: number;
  raca?: string;
  telefones: {
    codigo?: string;
    ddd: string;
    ddi?: string;
    numero: string;
    tipo: number;
  }[];
}

interface SaoMarcosCreatePatienResponse {
  codigo: string;
  matricula: string;
  nome: string;
  dataNascimento: string;
  genero: string;
  email: string;
  nomeMae?: string;
  raca?: string;
  cpf: string;
  peso?: number;
  telefones: {
    codigo: string;
    ddd: string;
    ddi: string;
    numero: string;
    tipo: number;
  }[];
}

interface SaoMarcosUpdatePatientResponse {
  codigo: string;
  matricula: string;
  nome: string;
  dataNascimento: string;
  genero: string;
  email: string;
  nomeMae?: string;
  raca?: string;
  cpf: string;
  peso?: number;
  telefones: {
    codigo: string;
    ddd: string;
    ddi: string;
    numero: string;
    tipo: number;
  }[];
}

interface SaoMarcosPatientSchedules {
  codigoPaciente: string;
}

interface SaoMarcosPatientSchedulesResponse {
  codigoConvenio: string;
  codigoPlano: string;
  codigoProcedimento: string;
  codigoEspecialidade: string;
  codigoMedico: string;
  codigoAtendimento: string;
  atualizadoPor: string;
  horario: {
    status: string;
    dataHoraAgendamento: string;
  };
}

export {
  SaoMarcosCreatePatient,
  SaoMarcosUpdatePatient,
  SaoMarcosUpdatePatientResponse,
  SaoMarcosGetPatientResponse,
  SaoMarcosCreatePatienResponse,
  SaoMarcosPatientSchedulesResponse,
  SaoMarcosPatientSchedules,
};
