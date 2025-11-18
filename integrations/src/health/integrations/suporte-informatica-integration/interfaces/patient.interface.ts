import { SIDefaultRequestResponse } from './';

interface SIDoPatientLoginRequest {
  Nome: string;
  Telefone: string;
  DataNascimento: string;
  CPF: string;
  PrimeiroNome?: string;
  UltimoNome?: string;
  TipoLogin: number;
  Carteira: string;
}

interface SIGetPatientByCpfRequest {
  NomePessoa?: string;
  Telefone?: string;
  DataNascimento: string;
  CPF: string;
  NomeMae?: string;
}

interface SIGetPatientByCpfResponse extends SIDefaultRequestResponse {
  CodPessoa: number;
  CodUsuario: number;
  DesNomePessoa: string;
  DatNascimento: string;
  DesCPF: string;
  TelefoneResidencial: string;
  TelefoneComercial: string;
  TelefoneCelular: number;
  DesNomeMae: string;
}

interface SIDoPatientLoginResponse extends SIDefaultRequestResponse {
  Token: string;
  PessoaLogin: {
    ListaConvenios: {
      COD_CONVENIO: number;
      DES_CONVENIO: string;
      DES_SIGLA: string;
    }[];
    COD_PESSOA: number;
    DES_NOMEPESSOA: string;
    COD_USUARIO: number;
    COD_SITUACAO: string;
    COD_SEXO: string;
    DAT_NASCIMENTO: string;
    DES_EMAIL: string;
    NUM_DDDRESIDENCIAL: number;
    NUM_TELEFONERESIDENCIAL: number;
    NUM_TELEFONECELULAR: number;
    NUM_DDDCOMERCIAL: number;
    NUM_DDDCELULAR: number;
    DES_CPF: string;
  };
  UsuarioLogin: {
    COD_USUARIO: number;
    DES_LOGIN: string;
  };
}

interface SICheckPatientExistsRequest {
  Nome: string;
  Telefone: string;
}

interface SICheckPatientExistsResponse extends SIDefaultRequestResponse {
  QuantidadeOcorrencias: number;
}

interface SIGetPatientDataRequest {
  CodPessoa: number;
}

interface SIGetPatientDataResponse extends SIDefaultRequestResponse {
  DadosPessoa: {
    COD_PESSOA: number;
    DES_NOMEPESSOA: string;
    COD_USUARIO: number;
    COD_SITUACAO: number;
    COD_SEXO: string;
    DAT_NASCIMENTO: string;
    DES_EMAIL: string;
    COD_SEQLOCALIDADE: number;
    NUM_DDDRESIDENCIAL: number;
    NUM_TELEFONERESIDENCIAL: number;
    NUM_DDDCELULAR: number;
    NUM_TELEFONECELULAR: string;
    DHO_CADASTRAMENTO: string;
    DES_CPF: string;
  };
}

interface SICreatePatientRequest {
  Nome: string;
  Telefone: string;
  DataNascimento: string;
  Sexo: string;
  CPF: string;
  NomeMae?: string;
  /**
   * @TipoTelefone
   * 1 = residencial
   * 2 = comercial
   * 3 = celular
   */
  TipoTelefone?: number;
  Email?: string;
  Convenio?: number;
  Carteira?: string;
  Plano?: string;
  TipoEnd?: number;
  CEP?: string;
  Endereco?: string;
  Numero?: string;
  Complemento?: string;
  Bairro?: string;
  SeqCodLocalidade?: number;
}

interface SICreatePatientResponse extends SIDefaultRequestResponse {
  Token: string;
  PessoaLogin: {
    ListaConvenios: {
      COD_CONVENIO: number;
      DES_CONVENIO: string;
      DES_SIGLA: string;
    }[];
    COD_PESSOA: number;
    DES_NOMEPESSOA: string;
    COD_USUARIO: number;
    COD_SITUACAO: string;
    COD_SEXO: string;
    DAT_NASCIMENTO: string;
    DES_EMAIL: string;
    NUM_DDDRESIDENCIAL: number;
    NUM_TELEFONERESIDENCIAL: number;
    NUM_DDDCOMERCIAL: number;
    NUM_DDDCELULAR: number;
    NUM_TELEFONECELULAR: number;
    DES_CPF?: string;
  };
  UsuarioLogin: {
    COD_USUARIO: number;
    DES_LOGIN: string;
  };
}

export {
  SIDoPatientLoginRequest,
  SIDoPatientLoginResponse,
  SICheckPatientExistsRequest,
  SICheckPatientExistsResponse,
  SIGetPatientDataRequest,
  SIGetPatientDataResponse,
  SICreatePatientRequest,
  SICreatePatientResponse,
  SIGetPatientByCpfRequest,
  SIGetPatientByCpfResponse,
};
