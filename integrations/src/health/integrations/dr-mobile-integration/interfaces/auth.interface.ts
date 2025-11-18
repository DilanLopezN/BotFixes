interface DrMobileAuthParamsRequest {
  email: string;
  senha: string;
}

interface DrMobileAuthResponse {
  token: string;
  tipo: 'Bearer';
}

export { DrMobileAuthParamsRequest, DrMobileAuthResponse };
