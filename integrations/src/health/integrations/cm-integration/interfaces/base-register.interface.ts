type SpecialityType = 'E' | 'C';

interface SpecialityRequest {
  codigosClientes: string[];
  nome?: string;
  codigosUnidade?: string[];
  convenio: {
    codigo: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    codigoProduto?: string;
    carteirinha?: string;
  };
  ativoAgendamento: boolean;
}

interface SpecialityResponse {
  codigo?: string;
  nome?: string;
  tipo?: SpecialityType;
}

interface DoctorRequest {
  codigosClientes: string[];
  nome?: string;
  procedimento: {
    codigoEspecialidade?: string;
    codigo: string;
    tipoEspecialidade: SpecialityType;
  };
  convenio: {
    codigo: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    codigoProduto?: string;
    carteirinha?: string;
  };
  codigosUnidade?: string[];
  ativoAgendamento: boolean;
}

interface DoctorResponse {
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
}

interface InsuranceRequest {
  codigosClientes: string[];
  codigo?: string;
  nome?: string;
  codigosUnidade?: string[];
  procedimento: {
    codigoEspecialidade?: string;
    codigo?: string;
    tipoEspecialidade?: SpecialityType;
  };
  ativoAgendamento: boolean;
}

interface InsuranceResponse {
  codigo?: string;
  nome?: string;
  observacao?: string;
  qtdCaracteres?: string;
}

interface ProcedureRequest {
  codigosClientes: string[];
  codigoPaciente?: string;
  nome?: string;
  procedimentoEspecialidade: {
    codigo?: string;
    tuss?: string;
    nome?: string;
    codigoArea?: string;
    codigoClassificacao?: string;
    lateralidade?: string;
    codigoEspecialidade?: string;
    tipoEspecialidade: SpecialityType;
    medicoResponsavel?: {
      // Campo de array diferenciado, Ex: "[1,2,3]"
      codigo?: string;
    };
  };
  convenio: {
    codigo: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    codigoProduto?: string;
    carteirinha?: string;
  };
  codigosUnidade?: string[];
  ativoAgendamento: boolean;
}

interface ProcedureResponse {
  codigo?: string;
  tuss?: string;
  nome?: string;
  codigoArea?: string;
  codigoClassificacao?: string;
  lateralidade?: string;
  codigoEspecialidade?: string;
  tipoEspecialidade?: string;
  codigoSetor?: string;
  tipoSetor?: string;
  preparos?: string;
  quantidade?: string;
}

interface InsurancePlanRequest {
  codigosClientes: string[];
  nome?: string;
  codigoConvenio?: string;
  ativoAgendamento: boolean;
  codigosUnidades?: string[];
}

interface InsurancePlanResponse {
  codigo?: string;
  nome?: string;
  codigoConvenio?: string;
}

interface OrganizationUnitRequest {
  codigosClientes: string[];
  nome?: string;
  procedimento: {
    codigoEspecialidade?: string;
    codigo?: string;
    tipoEspecialidade?: SpecialityType;
  };
  convenio: {
    codigo: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    codigoProduto?: string;
    carteirinha?: string;
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
  ativoAgendamento: boolean;
}

interface OrganizationUnitResponse {
  codigo?: string;
  nome?: string;
  cobertura?: string;
  endereco?: string;
  telefone?: string;
}

interface PlanCategoryRequest {
  codigosClientes: string[];
  codigoConvenio?: string;
  codigoPlano?: string;
  ativoAgendamento: boolean;
}

interface PlanCategoryResponse {
  codigo: string;
  nome: string;
  codigoConvenio: string;
  codigoPlano?: string;
}

interface InsuranceSubPlanRequest {
  codigosClientes: string[];
  codigoConvenio?: string;
  codigoPlano?: string;
  ativoAgendamento: boolean;
}

interface InsuranceSubPlanResponse {
  codigo: string;
  nome: string;
  codigoConvenio: string;
  codigoPlano: string;
}

export {
  PlanCategoryResponse,
  PlanCategoryRequest,
  OrganizationUnitResponse,
  OrganizationUnitRequest,
  InsurancePlanResponse,
  InsurancePlanRequest,
  ProcedureResponse,
  ProcedureRequest,
  InsuranceResponse,
  InsuranceRequest,
  DoctorResponse,
  DoctorRequest,
  SpecialityResponse,
  SpecialityRequest,
  InsuranceSubPlanResponse,
  InsuranceSubPlanRequest,
};
