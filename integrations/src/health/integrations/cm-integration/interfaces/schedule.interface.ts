import { DoctorResponse } from './base-register.interface';

interface ListScheduleRequest {
  codigosClientes: string[];
  procedimento: {
    codigo: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade: string;
    tipoEspecialidade?: 'E' | 'C';
  };
  codigoPaciente?: string;
  codigosUnidade?: string[];
  medico: {
    codigo?: string;
    nome?: string;
    sexo?: string;
    crm?: string;
    estado?: string;
    cpf?: string;
    especialidade?: string;
    dataNascimento?: Date;
    email?: string;
    telefone?: string;
    doctor_id?: string;
  };
  convenio: {
    codigo: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    codigoProduto?: string;
    carteirinha?: string;
  };
  dataHoraInicio?: Date;
  dataHoraFim?: Date;
  horaDiaInicio?: Date;
  horaDiaFim?: Date;
}

interface ListScheduleResponse {
  codigo?: string;
  dataHoraAgendamento: Date;
  duracao?: string;
  procedimento: {
    codigo?: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade?: string;
    tipoEspecialidade?: string;
  };
  unidade: {
    codigo?: string;
    nome?: string;
    cobertura?: string;
    endereco?: string;
    telefone?: string;
  };
  medico: {
    codigo?: string;
    nome?: string;
    sexo?: string;
    crm?: string;
    estado?: string;
    cpf?: string;
    especialidade?: string;
    dataNascimento?: Date;
    email?: string;
    telefone?: string;
    doctor_id?: string;
  };
  convenio: {
    codigo?: string;
    nome?: string;
    observacao?: string;
    qtdCaracteres?: string;
  };
}

interface CreateAppointmentRequest {
  codigosClientes: string[];
  codigoPaciente: string;
  convenio: {
    codigo: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    codigoProduto?: string;
    carteirinha?: string;
    codigoSubplano?: string;
  };
  horario: {
    codigo?: string;
    dataHoraAgendamento: string;
    duracao?: string;
    procedimento: {
      codigo: string;
      tuss?: string;
      nome?: string;
      codigoArea?: string;
      codigoClassificacao?: string;
      lateralidade?: string;
      codigoEspecialidade: string;
      tipoEspecialidade: string;
    };
    unidade: {
      codigo: string;
      nome?: string;
      cobertura?: string;
      endereco?: string;
      telefone?: string;
    };
    medico?: {
      codigo?: string;
      nome?: string;
      sexo?: string;
      crm?: string;
      estado?: string;
      cpf?: string;
      especialidade?: string;
      dataNascimento?: string;
      email?: string;
      telefone?: string;
      doctor_id?: string;
    };
    convenio?: {
      codigo?: string;
      nome?: string;
      observacao?: string;
      qtdCaracteres?: string;
      codigoPlano?: string;
    };
  };
  procedimentosAdicionais?: Array<{
    codigo?: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade?: string;
    tipoEspecialidade?: string;
  }>;
  medicoSolicitante?: {
    codigo?: string;
    nome?: string;
    sexo?: string;
    crm?: string;
    estado?: string;
    cpf?: string;
    especialidade?: string;
    dataNascimento?: string;
    email?: string;
    telefone?: string;
    doctor_id?: string;
  };
  tipoClassificacao?: TypeOfService | string;
}

enum TypeOfService {
  followUp = '1',
  firstAppointment = '2',
  recurrence = '3',
}

interface CreateAppointmentResponse {
  codigo?: string;
  codigoConvenio?: string;
  codigoPlano?: string;
  estadoAgendamento?: string;
  paciente: {
    codigo?: string;
    nome?: string;
    email?: string;
    dataNascimento?: Date;
    genero?: string;
    matricula?: string;
  };
  horario: {
    codigo?: string;
    dataHoraAgendamento: string;
    duracao?: string;
    procedimento: {
      codigo?: string;
      tuss?: string;
      nome?: string;
      codigoArea?: string;
      codigoClassificacao?: string;
      lateralidade?: string;
      codigoEspecialidade?: string;
      tipoEspecialidade?: string;
      orientacao?: string;
    };
    unidade: {
      codigo?: string;
      nome?: string;
      cobertura?: string;
      endereco?: string;
      telefone?: string;
    };
    medico: {
      codigo?: string;
      nome?: string;
      sexo?: string;
      crm?: string;
      estado?: string;
      cpf?: string;
      especialidade?: string;
      dataNascimento?: Date;
      email?: string;
      telefone?: string;
      doctor_id?: string;
    };
    convenio: {
      codigo?: string;
      nome?: string;
      observacao?: string;
      qtdCaracteres?: string;
    };
  };
  observacao?: string;
  avisos?: string;
}

interface CancelAppointmentRequest {
  codigosClientes: string[];
  codigoAgendamento: string;
  codigoPaciente: string;
  procedimento: {
    codigoEspecialidade?: string;
    codigo?: string;
    tipoEspecialidade?: string;
  };
}

interface CancelAppointmentResponse {
  codigo?: string;
  codigoConvenio?: string;
  codigoPlano?: string;
  estadoAgendamento?: string;
  paciente: {
    codigo?: string;
    nome?: string;
    email?: string;
    dataNascimento?: Date;
    genero?: string;
    matricula?: string;
  };
  horario: {
    codigo?: string;
    dataHoraAgendamento: string;
    duracao?: string;
    procedimento: {
      codigo?: string;
      tuss?: string;
      nome?: string;
      codigoArea?: string;
      codigoClassificacao?: string;
      lateralidade?: string;
      codigoEspecialidade?: string;
      tipoEspecialidade?: string;
    };
    unidade: {
      codigo?: string;
      nome?: string;
      cobertura?: string;
      endereco?: string;
      telefone?: string;
    };
    medico: {
      codigo?: string;
      nome?: string;
      sexo?: string;
      crm?: string;
      estado?: string;
      cpf?: string;
      especialidade?: string;
      dataNascimento?: Date;
      email?: string;
      telefone?: string;
      doctor_id?: string;
    };
    convenio: {
      codigo?: string;
      nome?: string;
      observacao?: string;
      qtdCaracteres?: string;
    };
  };
}

interface GetAppointmentRequest {
  codigosClientes: string[];
  codigoAgendamento: string;
}

interface GetScheduleRequest {
  codigosClientes: string[];
  codigoHorario: string;
  procedimento: {
    codigo?: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade?: string;
    tipoEspecialidade?: string;
  };
}

interface GetScheduleResponse {
  codigo?: string;
  dataHoraAgendamento: Date;
  duracao?: string;
  procedimento: {
    codigo?: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade?: string;
    tipoEspecialidade?: string;
  };
  unidade: {
    codigo?: string;
    nome?: string;
    cobertura?: string;
    endereco?: string;
    telefone?: string;
  };
  medico: {
    codigo?: string;
    nome?: string;
    sexo?: string;
    crm?: string;
    estado?: string;
    cpf?: string;
    especialidade?: string;
    dataNascimento?: Date;
    email?: string;
    telefone?: string;
    doctor_id?: string;
  };
  convenio: {
    codigo?: string;
    nome?: string;
    observacao?: string;
    qtdCaracteres?: string;
  };
}

interface PatientScheduleRequestParams {
  codigosClientes: string;
  codigoPaciente: string;
  agendamentosFechados?: boolean;
}

interface PatientScheduleResponse {
  codigo?: string;
  codigoConvenio?: string;
  codigoPlano?: string;
  codigoCategoria?: string;
  codigoSubPlano?: string;
  estadoAgendamento?: 'Cancelado' | 'Agendado' | 'Não Executado';
  paciente: {
    codigo?: string;
    nome?: string;
    email?: string;
    dataNascimento?: Date;
    genero?: string;
    matricula?: string;
  };
  horario: {
    codigo?: string;
    dataHoraAgendamento: string;
    duracao?: string;
    procedimento: {
      codigo?: string;
      tuss?: string;
      nome?: string;
      codigoArea?: string;
      codigoClassificacao?: string;
      lateralidade?: string;
      codigoEspecialidade?: string;
      tipoEspecialidade?: string;
    };
    unidade: {
      codigo?: string;
      nome?: string;
      cobertura?: string;
      endereco?: string;
      telefone?: string;
    };
    medico: {
      codigo?: string;
      nome?: string;
      sexo?: string;
      crm?: string;
      estado?: string;
      cpf?: string;
      especialidade?: string;
      dataNascimento?: Date;
      email?: string;
      telefone?: string;
      doctor_id?: string;
    };
    convenio: {
      codigo?: string;
      nome?: string;
      observacao?: string;
      qtdCaracteres?: string;
    };
  };
  Retorno?: boolean;
}

interface SimplifiedListScheduleRequest {
  codigosClientes: string[];
  procedimento: {
    codigo: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade?: string;
    tipoEspecialidade: 'E' | 'C';
  };
  codigoPaciente?: string;
  generoPaciente?: string;
  idadePaciente?: string;
  pesoPaciente?: string;
  codigosUnidade?: string[];
  medicos: {
    codigo: string;
  }[];
  convenio: {
    codigo: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    codigoSubplano?: string;
    codigoProduto?: string;
    carteirinha?: string;
  };
  dataHoraInicio?: string;
  dataHoraFim?: string;
  horaDiaInicio?: string;
  horaDiaFim?: string;
  limitePorDia?: string;
  limitePorMedico?: string;
  tipoClassificacao?: string;
}

interface SimplifiedListSchedule {
  codigo: string;
  dataHoraAgendamento: string;
  duracao: string;
  idProcedimento: string;
  idUnidade: string;
  idMedico: string;
  idConvenio: string;
  codigoClassificacao?: string;
}

interface Doctor {
  [key: string]: DoctorResponse;
}

interface SimplifiedListScheduleResponse {
  horarios: SimplifiedListSchedule[];
  medicos: Doctor;
}

interface AppointmentValueResponse {
  descricao: string;
  valor: number;
}

interface ConfirmAppointmentResponse {
  id: string;
  patient_id: number;
}

interface AppointmentValueRequest {
  codigosClientes: string[];
  medico: {
    codigo: string;
    nome?: string;
    sexo?: string;
    crm?: string;
    estado?: string;
    cpf?: string;
    especialidade?: string;
    tiposEspecialidade?: number[];
    dataNascimento?: string;
    email?: string;
    telefone?: string;
    doctor_id?: string;
  };
  convenio: {
    codigo: string;
    codigoPlano: string;
    codigoSubplano?: string;
    codigoCategoria?: string;
    codigoProduto?: string;
    carteirinha?: string;
  };
  procedimento: {
    codigo: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade: string;
    tipoEspecialidade: string;
    codigoSetor?: string;
    tipoSetor?: string;
  };
  codigoUnidade?: string;
}

interface AppointmentConfirmationRequestParams {
  idERP: string;
  codigosClientes: string;
  idPaciente: string;
  nomePaciente?: string;
  tipoEC: string;
  data: string;
  fonte: string;
}

interface FollowUpAppointmentsResponse {
  codigoPaciente: string;
  dataAgenda: string;
  codigoUnidade: string;
  codigoProcedimento: string;
  codigoEspecialidade: string;
  codigoMedico: string;
  codigoConvenio: string;
  codigoCategoria: string;
  codigoPlano: string;
  tipoAtendimento: number;
  setorAtendimento: string;
  setorAgenda: string;
  codigoArea: string;
  lateralidade: string;
  possuiRetorno: boolean;
  dataLimite: string;
}

interface FollowUpAppointmentsRequestParams {
  codigoPaciente: string;
  codigosClientes: string[];
}

export {
  ListScheduleRequest,
  ListScheduleResponse,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  CancelAppointmentRequest,
  CancelAppointmentResponse,
  GetAppointmentRequest,
  GetScheduleRequest,
  GetScheduleResponse,
  PatientScheduleRequestParams,
  PatientScheduleResponse,
  SimplifiedListScheduleRequest,
  SimplifiedListScheduleResponse,
  SimplifiedListSchedule,
  AppointmentValueRequest,
  AppointmentValueResponse,
  TypeOfService,
  AppointmentConfirmationRequestParams,
  ConfirmAppointmentResponse,
  FollowUpAppointmentsResponse,
  FollowUpAppointmentsRequestParams,
};
