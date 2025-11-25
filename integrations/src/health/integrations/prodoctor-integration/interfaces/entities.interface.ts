// ========== INTERFACES DE DADOS DE ENTIDADES ==========

/**
 * Dados específicos de convênio no ProDoctor
 */
interface ProdoctorInsuranceData {
  ativo: boolean;
  cnpj?: string;
  telefone?: string;
  localProDoctorCodigo?: number;
  tipoConvenio?: number;
}

/**
 * Dados específicos de plano de convênio no ProDoctor
 */
interface ProdoctorInsurancePlanData {
  convenio: {
    codigo: number;
    nome: string;
  };
  ativo: boolean;
  codigo: number;
  nome: string;
}

/**
 * Dados específicos de médico/usuário no ProDoctor
 */
interface ProdoctorDoctorData {
  cpf?: string;
  crm?: string;
  conselho?: string;
  numeroConselho?: string;
  ativo?: boolean;
  especialidades?: Array<{
    codigo: number;
    nome: string;
  }>;
  locaisProDoctor?: number[];
  cns?: string;
  cnes?: string;
}

/**
 * Dados específicos de procedimento no ProDoctor
 */
interface ProdoctorProcedureData {
  tabela: {
    codigo: number;
    nome: string;
  };
  codigo: string;
  descricao?: string;
  valor?: number;
  honorario?: number;
  duracaoMinutos?: number;
  tipo?: string;
  exigeAutorizacao?: boolean;
  especialidades?: number[];
}

/**
 * Dados específicos de unidade no ProDoctor
 */
interface ProdoctorOrganizationUnitData {
  codigo: number;
  nome: string;
  cnpj?: string;
  telefone?: string;
  estadoRegistro?: number;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}

/**
 * Dados específicos de especialidade no ProDoctor
 */
interface ProdoctorSpecialityData {
  codigo: number;
  nome: string;
  tipo?: string;
}

/**
 * Dados específicos de tabela de procedimentos
 */
interface ProdoctorProcedureTableData {
  codigo: number;
  nome: string;
  descricao?: string;
  versao?: string;
  tipoTabela?: number;
}

// ========== EXPORTS ==========

export {
  ProdoctorInsuranceData,
  ProdoctorInsurancePlanData,
  ProdoctorDoctorData,
  ProdoctorProcedureData,
  ProdoctorOrganizationUnitData,
  ProdoctorSpecialityData,
  ProdoctorProcedureTableData,
};
