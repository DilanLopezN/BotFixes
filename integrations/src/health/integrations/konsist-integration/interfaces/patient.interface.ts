import { KonsistTelefone, KonsistContato } from './common.interface';

// ========== REQUEST INTERFACES ==========

export interface KonsistListarPacienteRequest {
  nome?: string;
  cpf?: string;
  rg?: string;
  email?: string;
}

export interface KonsistIncluirPacienteRequest {
  nome: string;
  cpf: string;
  datanascimento: string; // format: date
  sexo: string; // M ou F
  idconvenio: number;
  idmedico?: number;
  planoconvenio?: string;
  matriculaconvenio?: string;
  email?: string;
  telefone?: KonsistTelefone;
}

// ========== RESPONSE INTERFACES ==========

export interface KonsistDadosPacienteResponse {
  idpaciente?: number;
  nomeregistro?: string;
  nomesocial?: string;
  nascimento?: string; // format: date
  sexo?: string;
  idmedico?: number;
  idconvenio?: number;
  convenio?: string;
  plano?: string;
}

export interface KonsistPacienteResponse {
  idpaciente?: number;
  paciente?: string;
  telefone?: string;
  contatos?: KonsistContato[];
}

export interface KonsistIncluirPacienteResponse {
  idpaciente: number;
}
