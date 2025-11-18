interface AuthResponse {
  cd_funcionario: number;
  ds_funcionario: string;
  ds_email: string;
  cd_empresa: number;
  ds_token: string; // 4 horas de expiração
  dt_login: string;
  cd_medico: number;
}

interface PatientAuthResponse {
  cd_paciente: number;
  ds_paciente: string;
  ds_email: string;
  ds_token: string;
  cd_funcionario: number;
}

interface PatientAuthParamsRequest {
  id: string;
  pw: string;
}

export { AuthResponse, PatientAuthResponse, PatientAuthParamsRequest };
