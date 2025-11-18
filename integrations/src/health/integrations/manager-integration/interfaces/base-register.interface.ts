interface ManagerInsurancesResponse {
  disponivelWeb: boolean;
  faturarParticular: boolean;
  handle: number;
  nome: string;
  observacoesWeb: string | null;
}

interface ManagerDoctorsResponse {
  handle: number;
  nome: string;
  tipo: number;
  medico: string;
  crm: string;
  disponivelWeb: boolean;
  textoWeb: string | null;
}

interface ManagerResourceDoctorDetailsResponse {
  handle: number;
  nome: string;
  tipo: number;
  medico: number;
  crm: number;
  rqe: number;
  disponivelWeb: boolean;
  especialidades: [];
  tipoMedico: string;
}

interface ManagerInsurancesParamsRequest {
  tipoAgendamento?: string;
  unidadeFilial?: number;
}

interface ManagerDoctorsParamsRequest {
  servicos?: number;
  unidadeFilial?: number;
  especialidade?: number;
  convenio?: number;
  plano?: number;
  idadePaciente?: number;
}

interface ManagerResourceDoctorDetailsParamsRequest {
  handleRecurso: number;
}

interface ManagerSpecialitiesResponse {
  handle: number;
  nome: string;
  disponivelWeb: boolean;
}

interface ManagerProceduresResponse {
  handle: number;
  nome: string;
  nomeWeb: string;
  convenioServico: number;
  tipoServico: string;
  orientacoes: boolean;
  preparo: boolean;
  preparoPdf: boolean;
  observacoes: boolean;
  alturaMaxima: boolean;
  alturaMinima: boolean;
  pesoMaximo: boolean;
  pesoMinimo: boolean;
  idadeMaxima: boolean;
  idadeMinima: boolean;
}

interface ManagerSpecialitiesExamsResponse {
  handle: number;
  nome: string;
  textoWeb: string;
  disponivelWeb: boolean;
}

interface ManagerAppointmentTypeResponse {
  nome: string;
  servicos: string;
  tipo: string;
}

interface ManagerInsurancePlansResponse {
  handle: number;
  nome: string;
}

interface ManagerProceduresParamsRequest {
  convenio: number;
  especialidade: number;
  tipoServico: string;
  plano?: number;
}

interface ManagerSpecialitiesExamsParamsRequest {
  convenio: number;
  plano?: number;
}

interface ManagerProceduresExamsParamsRequest {
  convenio: number;
  plano?: number;
  grupoServico1?: number;
}

interface ManagerSpecialitiesParamsRequest {
  unidadesFiliais?: number;
  convenio?: number;
  plano?: number;
  medicos?: string; // Ex: 1,2,3,4
}

interface ManagerInsurancePlansParamsRequest {
  convenio: number;
}

interface ManagerOrganizationUnitsResponse {
  disponivelWeb: boolean;
  handle: number;
  nome: string;
  textoWeb: string | null;
}

export {
  ManagerInsurancesResponse,
  ManagerSpecialitiesResponse,
  ManagerProceduresResponse,
  ManagerAppointmentTypeResponse,
  ManagerOrganizationUnitsResponse,
  ManagerDoctorsResponse,
  ManagerInsurancePlansResponse,
  ManagerInsurancesParamsRequest,
  ManagerProceduresParamsRequest,
  ManagerSpecialitiesParamsRequest,
  ManagerInsurancePlansParamsRequest,
  ManagerDoctorsParamsRequest,
  ManagerResourceDoctorDetailsParamsRequest,
  ManagerResourceDoctorDetailsResponse,
  ManagerProceduresExamsParamsRequest,
  ManagerSpecialitiesExamsParamsRequest,
  ManagerSpecialitiesExamsResponse,
};
