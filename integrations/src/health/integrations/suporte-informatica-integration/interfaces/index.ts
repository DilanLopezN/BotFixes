interface SIDefaultRequestParams {
  CodClienteOrigem: number;
  CodCanalAOL: number;
  Token?: string; // token do paciente
  VersaoCliente?: string;
}

interface SIDefaultRequestResponse {
  CodErro: number;
  MensagemErro: string;
}

export { SIDefaultRequestParams, SIDefaultRequestResponse };
