// ========== REQUEST INTERFACES ==========

export interface KonsistMedicoAgendamentoRequest {
  idconvenio: number;
  codigoprocedimento: string;
  nascimentopaciente: string; // format: date
  cpfpaciente: string;
  idlocal?: number;
  idespecialidade?: number;
}

export interface KonsistMedicoPacienteRequest {
  idmedico: number;
  idpaciente: number;
}

// ========== RESPONSE INTERFACES ==========

export interface KonsistMedicoResponse {
  id: number;
  nome?: string;
  crm?: string;
  local?: number;
  podemarcaratendido?: boolean;
}

export interface KonsistCamposUsuarioRetorno {
  id_usuario: number;
  id_medico_usuario: number;
  versao_api: string;
  obs: string;
}
