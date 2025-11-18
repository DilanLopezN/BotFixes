import { SIDefaultRequestResponse } from '.';

interface SIInsurancesResponse extends SIDefaultRequestResponse {
  listaConvenios: {
    COD_CONVENIO: number;
    DES_CONVENIO: string;
    DES_SIGLA: string;
    DES_CNPJ: string;
  }[];
}

interface SIInsuranceParamsRequest {}

interface SIInsurancePlansResponse extends SIDefaultRequestResponse {
  listaPlanosConvenio: {
    COD_TIPORESTRICAO: number;
    ID_PLANOCONVENIO: number;
    DES_PLANOCONVENIO: string;
    ID_EXCECAORESTRICAOCONVENIO: number;
    IND_SELECAO: boolean;
  }[];
}

interface SIInsurancePlansParamsRequest {
  CodConvenio?: number;
  CodProfissional?: number;
  CodCliente?: number;
}

interface SIAppointmentTypesResponse extends SIDefaultRequestResponse {
  listaTiposAtendimento: {
    IND_SELECAO: boolean;
    COD_TIPOATENDIMENTO: number;
    DES_TIPOATENDIMENTO: string;
    DES_CODIGOTIPOATENDINTEGRACAO: string;
    COD_PROCEDIMENTOVINCULADO: number;
  }[];
  PGCodProcedimentoVinculado: string;
}

interface SIAppointmentTypesParamsRequest {
  CodTipoProfissional: number;
}

interface SIProfessionalTypesResponse extends SIDefaultRequestResponse {
  ListaTiposProfissional: {
    IND_SELECAO: boolean;
    COD_TIPOPROFISSIONAL: number;
    DES_TIPOPROFISSIONAL: string;
    MAXMARCACOESMESMOPROFDIA: number;
    DES_MEUSPROFISSIONAIS: string;
    DES_OUTROSPROFISSIONAIS: string;
    COD_EXIBEPRECOOFERTA: number;
  }[];
}

interface SIProfessionalTypesParamsRequest {}

interface SISpecialitiesResponse extends SIDefaultRequestResponse {
  listaEspecialidades: {
    DAT_METAANS: string;
    COD_ESPECIALIDADE: number;
    DES_ESPECIALIDADE: string;
    NUM_METAANS: number;
    DES_ESPECIALIDADEINTEGRACAO: string;
  }[];
}

interface SISpecialitiesParamsRequest {
  CodConvenio: number;
  CodTipoAtendimento: number;
  CodTipoProfissional: number;
  CarteiraConvenio?: string;
  DescricaoPlano?: string;
  IdRedeAtendimento?: number;
}

interface SIProfessionalsResponse extends SIDefaultRequestResponse {
  listaProfissionais: {
    BIN_FOTO: string;
    COD_LOCAL: number;
    DES_NOMELOCAL: string;
    COD_PROFISSIONAL: number;
    DES_NOMEPROFISSIONAL: string;
    NUM_PRECOATENDIMENTO: number;
  }[];
}

interface SIProfessionalsExamsResponse extends SIDefaultRequestResponse {
  ListaProfissionaisLocais: {
    COD_LOCAL: number;
    DES_NOMELOCAL: string;
    COD_PROFISSIONAL: number;
    DES_NOMEPROFISSIONAL: string;
  }[];
}

interface SIProfessionalsParamsRequest {
  CODTipoAtendimento: number;
  CODEspecialidade: number;
  CODSeqLocalidade?: number;
  CODConvenio: number;
  SexoCliente?: string;
  DATNascimentoCliente: string;
  CODTipoProfissional: number;
  IdRedeAtendimento?: string;
  NumCarteiraConvenio?: string;
  CodLocalTotem?: number;
}

interface SIProfessionalsExamsParamsRequest {
  ID_PROCEDIMENTO: number;
  COD_PROCEDIMENTO: number;
  COD_FORMAATENDIMENTO?: number;
}

interface SILocalParamsRequest {
  CodLocal: number;
}

interface SILocalResponse extends SIDefaultRequestResponse {
  Local: {
    COD_LOCAL: number;
    DES_NOMELOCAL: string;
    DES_ENDERECO: string;
    DES_NUM: string;
    DES_COMPL: string;
    DES_BAIRRO: string;
    DES_CEP: string;
    DES_NOMELOCALIDADE: string;
    DES_UF: string;
    COD_SEQLOCALIDADE: number;
  };
}

interface SILocationsResponse extends SIDefaultRequestResponse {
  listaLocalidades: {
    CodSeqLocalidade: number;
    DesNomeLocalidade: string;
    DesUF: string;
    listaLocais: {
      CodLocal: number;
      DesNomeLocal: string;
    }[];
  }[];
}

interface SIProceduresParamsRequest {
  IdGrupoProcedimento: number;
  IdSubGrupoProcedimento: number;
}

interface SIProceduresResponse extends SIDefaultRequestResponse {
  ListaProcedimentos: {
    ID_PROCEDIMENTO: number;
    COD_PROCEDIMENTO: number;
    DES_NOMEPROCEDIMENTO: string;
  }[];
}

interface SIProceduresGroupParamsRequest {}

interface SIListAllProfessionalsRequest {
  CodParteNome?: number;
  DesNome?: string;
  CodProfissionais?: string;
}

interface SIListAllProfessionalsResponse extends SIDefaultRequestResponse {
  listaProfissionais: {
    CodProfissional: number;
    DesNomeProfissional: string;
    CodTipoProfissional: number;
    DesTipoProfissional: string;
    ListaEspecialidades: {
      CodEspecialidade: number;
      DesEspecialidade: string;
    }[];
  }[];
}

interface SIProceduresGroupResponse extends SIDefaultRequestResponse {
  ListaGruposSubgrupos: {
    ID_GRUPOPROCEDIMENTO: number;
    DES_GRUPOPROCEDIMENTO: string;
    ID_SUBGRUPOPROCEDIMENTO: number;
    DES_SUBGRUPOPROCEDIMENTO: string;
  }[];
}

export {
  SIInsurancesResponse,
  SIInsuranceParamsRequest,
  SIInsurancePlansResponse,
  SIInsurancePlansParamsRequest,
  SIAppointmentTypesResponse,
  SIAppointmentTypesParamsRequest,
  SIProfessionalTypesResponse,
  SIProfessionalTypesParamsRequest,
  SISpecialitiesResponse,
  SISpecialitiesParamsRequest,
  SIProfessionalsResponse,
  SIProfessionalsParamsRequest,
  SILocalParamsRequest,
  SILocalResponse,
  SIProceduresParamsRequest,
  SIProceduresResponse,
  SIProceduresGroupParamsRequest,
  SIProceduresGroupResponse,
  SIProfessionalsExamsParamsRequest,
  SIProfessionalsExamsResponse,
  SILocationsResponse,
  SIListAllProfessionalsRequest,
  SIListAllProfessionalsResponse,
};
