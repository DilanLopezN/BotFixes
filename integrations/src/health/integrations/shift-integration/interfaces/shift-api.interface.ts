export interface ShiftTokenResponse {
  sucesso: string;
  token: string;
}

export interface ShiftPaciente {
  codigo: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
}

export interface ShiftProcedimento {
  codigo: string;
  mnemonico: string;
  descricao: string;
  status: string;
  urlPdfResultadoProcedimento: string;
}

export interface ShiftAtendimento {
  codigoOs: string;
  dataCadastro: string;
  horaCadastro: string;
  dataPromessa: string;
  horaPromessa: string;
  mensagemResultado: string;
  urlPdfResultado: string;
  procedimentos: ShiftProcedimento[];
}

export interface ShiftConsultaLaudosResponse {
  paciente: ShiftPaciente;
  atendimento: ShiftAtendimento[];
}

export interface ShiftErrorResponse {
  errorMessage: string;
}

export interface ShiftCredentials {
  usuario: string;
  senha: string;
  baseUrl: string;
}
