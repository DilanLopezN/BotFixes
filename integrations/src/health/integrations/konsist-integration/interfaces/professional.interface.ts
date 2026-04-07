// ========== REQUEST INTERFACES ==========

export interface KonsistDoctorScheduleRequest {
  idconvenio: number;
  codigoprocedimento: string;
  nascimentopaciente: string; // format: date
  cpfpaciente: string;
  idlocal?: number;
  idespecialidade?: number;
}

export interface KonsistDoctorPatientRequest {
  idmedico: number;
  idpaciente: number;
}

// ========== RESPONSE INTERFACES ==========

export interface KonsistListDoctorResponse {
  id: number;
  nome?: string;
  crm?: string;
  local?: number;
  podemarcaratendido?: boolean;
}

export interface KonsistLoggedUserResponse {
  id_usuario: number;
  id_medico_usuario: number;
  versao_api: string;
  obs: string;
}
