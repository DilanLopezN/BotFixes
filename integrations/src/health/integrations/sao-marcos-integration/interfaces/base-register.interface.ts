interface SaoMarcosInsurancesResponse {
  codigo: string;
  nome: string;
  planos: {
    codigo: string;
    nome: string;
  }[];
}

interface SaoMarcosDoctorsResponse {
  codigo: string;
  nome: string;
}

interface SaoMarcosInsurancesParamsRequest {}

interface SaoMarcosDoctorsParamsRequest {}

interface SaoMarcosSpecialitiesResponse {
  codigo: string;
  nome: string;
  tipoAgendamento: 'C' | 'E';
}

interface SaoMarcosProceduresResponse {
  codigo: string;
  nome: string;
  codigoEspecialidade: string;
  tipoEspecialidade: string;
}

interface SaoMarcosAppointmentTypeResponse {
  codigo: string;
  nome: string;
}

interface SaoMarcosInsurancePlansResponse {
  codigo: string;
  nome: string;
  codigoConvenio: string;
}

interface SaoMarcosProceduresParamsRequest {}

interface SaoMarcosSpecialitiesParamsRequest {}

interface SaoMarcosInsurancePlansParamsRequest {}

interface SaoMarcosOrganizationUnitsResponse {
  codigo: string;
  nome: string;
  endereco: {
    cidade: string;
    numero: string;
    bairro: string;
    rua: string;
    cep: string;
  };
}

interface SaoMarcosResourcesResponse {}

export {
  SaoMarcosInsurancesResponse,
  SaoMarcosSpecialitiesResponse,
  SaoMarcosProceduresResponse,
  SaoMarcosAppointmentTypeResponse,
  SaoMarcosOrganizationUnitsResponse,
  SaoMarcosDoctorsResponse,
  SaoMarcosResourcesResponse,
  SaoMarcosInsurancePlansResponse,
  SaoMarcosInsurancesParamsRequest,
  SaoMarcosProceduresParamsRequest,
  SaoMarcosSpecialitiesParamsRequest,
  SaoMarcosInsurancePlansParamsRequest,
  SaoMarcosDoctorsParamsRequest,
};
