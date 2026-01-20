import { KonsistContato } from './common.interface';

// ========== REQUEST INTERFACES ==========

export interface KonsistAgendaRequest {
  idMedico: number;
  data: string; // format: date
  qtdDias: number;
  emailUsuario: string;
  mostrarHVazio?: number;
}

export interface KonsistAgendaHorarioRequest {
  idmedico: number;
  idconvenio: number;
  codigoprocedimento: string;
  idlocal?: number;
  datainicio?: string; // format: date
  datafim?: string; // format: date
  idpaciente?: number;
  datanascimentopaciente?: string; // format: date
  idespecialidade?: number;
}

export interface KonsistPeriodoAgendamentoRequest {
  datai: string; // format: date
  dataf: string; // format: date
  idpaciente?: number;
  cpfPaciente?: string;
  status?: string; // C=Confirmado, L=chegou, D=Desmarcado, F=Faltou, A=Atendido, M=Atendido Medico
}

export interface KonsistPreAgendamentoRequest {
  origem?: number; // 0=Konsist, 1=Parceiros
  chave: number;
  idpaciente: number;
  idmedico: number;
  idconvenio: number;
  idplano?: number;
  idservico: number;
  codigoprocedimento: string;
  descricaoprocedimento: string;
  valorprocedimento?: number;
  observacao?: string;
}

export interface KonsistStatusRequest {
  chave: number;
  status: number; // 1=Confirmado, 2=Desmarcado, 3=Atendido, 4=Faltou, 5=Chegou, 6=Liberado
  emailusuario?: string;
}

export interface KonsistProtocoloStatusRequest {
  datasolicitacao?: string; // format: date
  protocolo?: string;
  cpfpaciente?: string;
  idstatus?: number;
  idmedico?: number;
}

// ========== RESPONSE INTERFACES ==========

export interface KonsistAgendaRetorno {
  _id: number;
  name?: string;
  convenio?: string;
  startdatetime?: string;
  enddatetime?: string;
  des_hora?: string;
  status?: string;
  ind_status?: string;
  obs?: string;
  idpaciente?: number;
  nome_paciente?: string;
  endereco?: string;
  bairro?: string;
  num_cep?: string;
  fone1?: string;
  fone2?: string;
  des_email?: string;
  usuario_marcou?: string;
  usuario_confirmou?: string;
}

export interface KonsistAgendamentoMarcacao {
  codigo?: string;
  descricao?: string;
}

export interface KonsistAgendamentoItem {
  agendamento_chave?: number;
  agendamento_medico?: string;
  agendamento_especialidade?: string;
  agendamento_data?: string; // format: date
  agendamento_hora?: string;
  agendamento_procedimento?: string;
  agendamento_codigo_procedimento?: string;
  agendamento_preparo?: string;
  agendamento_status?: string;
  agendamento_categoria?: string;
  agendamento_status_personalizado?: string;
  agendamento_marcacao?: KonsistAgendamentoMarcacao[];
  empresa_unidade?: string;
  empresa_endereco?: string;
  empresa_telefone?: string;
}

export interface KonsistAgendamentoResponse {
  id: number;
  nome: string;
  cpf: string;

  email: string;
  datanascimento: string;
  telefone?: string;
  contatos?: KonsistContato[];
  agendamento?: KonsistAgendamentoItem[];
}

export interface KonsistAgendaHorarioRetorno {
  chave: number;
  idmedico: number;
  data: string; // format: date
  hora: string;
}

export interface KonsistProtocoloStatusRetorno {
  id?: number;
  protocolo?: string;
  datasolicitacao?: string; // format: date
  idservico?: number;
  codigoprocedimento?: string;
  decricaoprocedimento?: string;
  Fidpaciente?: number;
  cpfpaciente?: string;
  nomepaciente?: string;
  idmedico?: number;
  titutomedico?: string;
  medico?: string;
  conselho?: string;
  numconselho?: string;
  idconvenio?: number;
  convenio?: string;
  idplano?: number;
  plano?: string;
  idstatus?: number;
  status?: string;
  observacao?: string;
}

export interface KonsistRetornoAlteracaoStatus {
  chave: number;
  statusalterado: boolean;
  erroalteracaostatus?: string;
}
