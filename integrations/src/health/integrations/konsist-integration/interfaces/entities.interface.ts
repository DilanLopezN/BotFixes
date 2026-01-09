// ========== INTERFACES DE DADOS DE ENTIDADES ==========

/**
 * Dados específicos de convênio no Konsist
 */
interface KonsistInsuranceData {
  codigo?: string;
  reduzido?: string;
  cnpj?: string;
  status?: string;
}

/**
 * Dados específicos de médico no Konsist
 */
interface KonsistDoctorData {
  crm?: string;
  local?: number;
  podemarcaratendido?: boolean;
}

/**
 * Dados específicos de unidade no Konsist
 */
interface KonsistOrganizationUnitData {
  tipo?: string;
  cnpj?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  ddd?: string;
  fone?: string;
  site?: string;
  localizacao?: string;
  complemento?: string;
}

/**
 * Dados específicos de paciente no Konsist
 */
interface KonsistPatientData {
  nomesocial?: string;
  convenio?: string;
  plano?: string;
}

// ========== EXPORTS ==========

export {
  KonsistInsuranceData,
  KonsistDoctorData,
  KonsistOrganizationUnitData,
  KonsistPatientData,
};
