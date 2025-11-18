interface ManagerAuthParamsRequest {
  username: string;
  password: string;
}

interface ManagerAuthResponse {
  token: string;
  type: 'Bearer';
}

interface ManagerPatientAuthParamsRequest {
  cpfOrProtocolo: string;
  dataNascimento: string;
}

interface ManagerPatientAuthPasswprdParamsRequest {
  cpfOrProtocolo: string;
  password: string;
}

interface ManagerPatientAuthResponse {
  token: string;
  type: 'Bearer';
}

interface ManagerPatientExistsParamsRequest {
  cpf: string;
}

export {
  ManagerAuthParamsRequest,
  ManagerAuthResponse,
  ManagerPatientAuthParamsRequest,
  ManagerPatientAuthResponse,
  ManagerPatientExistsParamsRequest,
  ManagerPatientAuthPasswprdParamsRequest,
};
