import { KonsistPhone, KonsistContact } from './common.interface';

// ========== REQUEST INTERFACES ==========

export interface KonsistListPatientsRequest {
  nome?: string;
  cpf?: string;
  rg?: string;
  email?: string;
}

export interface KonsistCreatePatientRequest {
  nome: string;
  cpf: string;
  datanascimento: string; // format: date
  sexo: string; // M ou F
  idconvenio: number;
  idmedico?: number;
  planoconvenio?: string;
  matriculaconvenio?: string;
  email?: string;
  telefone?: KonsistPhone;
}

// ========== RESPONSE INTERFACES ==========

export interface KonsistPatientDataResponse {
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

export interface KonsistPatientResponse {
  idpaciente?: number;
  paciente?: string;
  telefone?: string;
  contatos?: KonsistContact[];
}

export interface KonsistCreatePatientResponse {
  idpaciente: number;
}
