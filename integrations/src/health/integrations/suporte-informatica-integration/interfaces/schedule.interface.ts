import { SIDefaultRequestResponse } from '.';

interface SIListAvailableSchedule {
  COD_LOCAL: number;
  COD_PROFISSIONAL: number;
  DAT_ATENDIMENTO: string;
  HOR_ATENDIMENTO: string;
  COD_ESPECIALIDADE: number;
  COD_TURNO: number;
  ID_PROGRAMACAO: number;
  ID_HORARIO: number;
  COD_PESSOA: number;
  COD_CONVENIO: number;
  COD_STATUSHORARIO: number;
  COD_TIPOATENDIMENTO: number;
  NUM_PRECOATENDIMENTO: number;
  DHO_BLOQUEIO: string;
  COD_MOTIVOBLOQUEIO: number;
  DES_TIPOHORARIO: string;
  COD_CANALAGENDAMENTO: number;
  DES_OBS: string;
  NUM_DDDFIXOCONF: number;
  NUM_TELEFONEFIXOCONF: string;
  NUM_DDDCELULARCONF: number;
  NUM_TELEFONECELULARCONF: string;
  DHO_RECEPCAOCLIENTE: string;
  COD_SUBESPECIALIDADE: number;
}

interface SIListAvailableSchedulesResponse extends SIDefaultRequestResponse {
  listaProfissionais: {
    COD_PROFISSIONAL: number;
    COD_CLIENTE: number;
    DES_TRATAMENTO: string;
    DES_NOMEPROFISSIONAL: string;
    NUM_CONSELHO: number;
    BIN_FOTO: string;
    DES_MINICURRICULO: string;
    COD_SEXO: string;
    COD_TIPOPROFISSIONAL: number;
  }[];
  listaHorarios: SIListAvailableSchedule[];
  listaLocais: {
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
    NUM_DDD: number;
    NUM_TELEFONE1: string;
    NUM_TELEFONE2: string;
    NUM_TELEFONE3: string;
    NUM_FAX: string;
    NUM_LATITUDE: number;
    NUM_LONGITUDE: number;
    COD_ACESSODEFICIENTE: number;
    COD_ACESSOCEGOS: number;
    COD_ACESSOSURDOS: number;
    COD_ACESSOAMBULANCIAS: number;
    COD_TIPOESTACIONAMENTO: number;
    DES_PONTOSREFERENCIA: string;
    DES_CODIGOLOCALINTEGRACAO: string;
    DES_TELEFONEGRATUITO: string;
  }[];
}

interface SIListAvailableSchedulesParamsRequest {
  CODTipoAtendimento: number;
  CODEspecialidade: number;
  CODSeqLocalidade?: number;
  CODProfissional?: number;
  CODConvenio: number;
  CODPessoa: number;
  SexoCliente: string;
  DATNascimentoCliente: string;
  CODLocal?: number;
  DATReferenciaHorarios?: string;
  CODTipoProfissional: number;
  IdRedeAtendimento?: string;
  NumCarteiraConvenio?: string;
}

interface SIPatientSchedule {
  Profissional: {
    COD_PROFISSIONAL: number;
    DES_TRATAMENTO: string;
    DES_NOMEPROFISSIONAL: string;
    NUM_CONSELHO: number;
    DES_CODPROFISSIONALINTEGRACAO: string;
  };
  Local: {
    COD_LOCAL: number;
    DES_NOMELOCAL: string;
    DES_ENDERECO: string;
    DES_BAIRRO: string;
    DES_CEP: string;
    DES_NOMELOCALIDADE: string;
    DES_UF: string;
    COD_SEQLOCALIDADE: number;
    NUM_DDD: number;
    NUM_TELEFONE1: string;
    NUM_TELEFONE2: string;
    NUM_TELEFONE3: string;
    NUM_FAX: string;
    DES_PONTOSREFERENCIA: string;
    DES_TELEFONEGRATUITO: string;
  };
  Convenio: {
    COD_CONVENIO: number;
    DES_CONVENIO: string;
    DES_SIGLA: string;
  };
  Pessoa: {
    COD_PESSOA: number;
    DES_NOMEPESSOA: string;
  };
  TipoAtendimento: {
    COD_TIPOATENDIMENTO: number;
    DES_TIPOATENDIMENTO: string;
    DES_CODIGOTIPOATENDINTEGRACAO: string;
    COD_PROCEDIMENTOVINCULADO: number;
  };
  Especialidade: {
    COD_ESPECIALIDADE: number;
    DES_ESPECIALIDADE: string;
  };
  DES_STATUS: string; // 6 = Cancelado
  DES_CORSTATUSHORARIO: string;
  COD_EXIBEBTNCONFIRMA: number;
  DES_TXTCONFIRMACAO: string;
  COD_EXIBEBTNDESMARCA: number;
  DES_TXTDESMARCACAO: string;
  DAT_ATENDIMENTO: string;
  HOR_ATENDIMENTO: string;
  ID_HORARIO: number;
  COD_STATUSHORARIO: number;
  COD_CONVENIO: number;
  NUM_PRECOATENDIMENTO: number;
  DES_TIPOHORARIO: number;
  NUM_DDDFIXOCONF: number;
  NUM_TELEFONEFIXOCONF: string;
  NUM_DDDCELULARCONF: number;
  NUM_TELEFONECELULARCONF: string;
  ID_REQUISICAOATENDIMENTO: number;
  DES_CARTEIRACONVENIO: string;
  ID_REDEATENDIMENTO: number;
}

interface SIPatientScheduleDetails {
  Agendamento: SIPatientSchedule & {
    InformacoesHorarioExame: {
      ID_PROCEDIMENTO: number;
      COD_PROCEDIMENTO: number;
      DES_NOMEPROCEDIMENTO: string;
      NUM_PRECOATENDIMENTO: number;
      BIN_TEXTOEXPLICATIVO: string;
    }[];
  };
}

interface SIPatientSchedulesResponse extends SIDefaultRequestResponse {
  listaAgendamentos: SIPatientSchedule[];
}

interface SIPatientSchedulesParamsRequest {
  COD_PESSOA: number;
  RetornarHistorico: boolean;
}

interface SIPatientScheduleDetailsParamsRequest {
  COD_PESSOA: number;
  ID_HORARIO: number;
  COD_STATUSHORARIO?: number;
}

interface SICreateScheduleResponse extends SIDefaultRequestResponse {
  listaAlertas: {
    COD_ALERTA: number;
    DES_ALERTA: string;
    COD_SOLICITARCONFIRMLEITURA: number;
  }[];
}

interface SICreateScheduleParamsRequest {
  IDHorario: number;
  DHOAtendimento: string;
  CODPessoa: number;
  CODEspecialidade: number;
  CODConvenio: number;
  CODTipoAtendimento: number;
  CODUsuarioRespReserva?: number;
  CODUsuarioAtendimento?: number;
  NUMPrecoAtendimento?: number;
  NumCarteiraConvenio?: string;
  IdRedeAtendimento?: number;
  EmailPessoa?: string;
  funcaoSeguranca?: string;
  CRM?: number;
  CODLocal?: number;
  CODCliente?: number;
  DatAtendimento: string;
  CODProfissional: number;
  DataNascimentoCliente: string;
  SexoCliente: string;
  IDPlanoConvenio?: number;
  DESPlanoConvenio?: string;
  AceiteMensagemConfirmacao: boolean;
}

interface SICancelScheduleParamsRequest {
  ID_HORARIO: number;
  ID_MOTIVOCANCELAMENTO: number;
  DES_MOTIVOCANCELAMENTO: string;
  AceiteMensagemConfirmacao: boolean;
  COD_USUARIOLOGADO: number;
}

interface SiListAvailableExamsParamsRequest {
  CodCliente: number;
  TipoConsulta: number;
  ListaProcedimentoLocal: {
    CodLocal?: number;
    CodProfissional?: number;
    ID_PROCEDIMENTO: number;
    COD_PROCEDIMENTO: number;
    DES_NOMEPROCEDIMENTO?: string;
  }[];
  CodTipoAtendimento: number;
  CodTipoProfissional: number;
  CodEspecialidade?: number;
  CodSeqLocalidade?: number;
  CodProfissional?: number;
  DesNomeProfissional?: string;
  CodSexo: string;
  NumIdadeInicial?: number;
  NumIdadeFinal?: number;
  NUMTempoFormadoInicial?: number;
  NUMTempoFormadoFinal?: number;
  CODSeqRegiao?: number;
  DESNomeBairro?: string;
  DESEndereco?: string;
  DESCEP?: string;
  DATInicialPeriodo: string;
  DATFinalPeriodo: string;
  NUMDiaSemana?: number;
  CodTurno?: number;
  HORInicialPeriodo?: string;
  HORFinalPeriodo?: string;
  CodConvenio: number;
  DesPlanoConvenio?: string;
  CodCartao?: string;
  NUMPrecoInicial?: number;
  pNUMPrecoFinal?: number;
  TipoRedeCliente?: number;
  SexoCliente: string;
  CodLocalClinica?: number;
  IDPrograma?: string;
  CodClienteMarcacao?: number;
  UF?: string;
  CodFormaAtendimento?: number;
  IdadeCliente?: number;
}

interface SIListAvailableExamesResponse extends SIDefaultRequestResponse {
  ResumoPesquisa: string;
  CodExibeHorarios: number;
  IndDataValidadeCarteira: number;
  IndSemCarteira: number;
  LISTALOCAIS: [
    {
      COD_CLIENTE: number;
      COD_PFPJ: number;
      SITECLIENTE: string;
      DES_TEXTODISTANCIA: string;
      LISTAPROCEDIMENTOSLOCAL: [
        {
          ID_PROCEDIMENTO: number;
          COD_PROCEDIMENTO: number;
          DES_NOMEPROCEDIMENTO: string;
          DES_NOVONOMEPROCEDIMENTO: string;
          COD_LOCAL: number;
          LISTAPROFISSIONAISPROCEDLOCAL: [
            {
              COD_PROFISSIONAL: number;
              COD_LOCAL: number;
              ID_PROCEDIMENTO: number;
              COD_SEXO: string;
              DES_OBSERVACAOPRECO: string;
              DES_NOMEPROFISSIONAL: string;
              DES_MINICURRICULO: string;
              DES_DESCRICAOALERTA: string;
              COD_RECEBENOTIFICACAO: number;
              DES_EMAILCLIENTE: string;
              EXIGECONFIRMACAOLEITURAALERTAS: boolean;
              NUM_PRECOPROCEDIMENTOPROF: number;
              BIN_FOTO: string;
              LISTADATAS: [
                {
                  DAT_ATENDIMENTO: string;
                  COD_LOCAL: number;
                  ID_PROCEDIMENTO: number;
                  COD_PROFISSIONAL: number;
                  LISTAHORARIOS: [
                    {
                      ID_HORARIO: number;
                      HOR_ATENDIMENTO: string;
                      NUM_PRECOPROCEDIMENTOPROF: number;
                      ID_PROGRAMACAO: number;
                    },
                  ];
                },
              ];
            },
          ];
          FORMAATENDIMENTO: {
            DES_FORMAATENDIMENTO: string;
            DES_ARQUIVORTF: string;
          };
        },
      ];
      COD_LOCAL: number;
    },
  ];
}

interface SICreateScheduleExamParamsRequest {
  CODUsuarioMarcacao: number;
  CODConvenioMarcacao: number;
  DesCarteiraConvenio?: string;
  IDRedeAtendimentoConvenio: number;
  CODTipoAtendimento: number;
  DesEmailMarcacao: string;
  DesPlano?: string;
  CodAtualizarCadastro: boolean;
  CodTipoTelFixo?: number;
  NumDDDTelFixo?: number;
  NumTelFixo?: number;
  NumDDDCelular?: number;
  NumTelCelular?: number;
  CODPessoaMarcacao: number;
  IndFamiliar: boolean;
  ConfirmaLeituraTermo: number;
  CodFormaAtendimento: number;
  IdErroConfirmacao?: string;
  DatValidadeCarteira?: string;
  DesProtocoloAtendimento?: string;
  ListaExamesSelecionados: {
    COD_LOCAL: number;
    ID_PROCEDIMENTO: number;
    COD_PROFISSIONAL: number;
    ID_HORARIO: number;
    HOR_ATENDIMENTO: string;
    DAT_ATENDIMENTO: string;
    NUM_VALORATENDIMENTO: number;
    EXIGECONFIRMACAOLEITURAALERTAS: boolean;
    CONFIRMALEITURAALERTA: boolean;
    DES_EMAILCLIENTE?: string;
    COD_RECEBENOTIFICACAO: number;
    ID_PROGRAMACAO?: number;
    COD_TIPOAGENDAMENTO?: number;
  }[];
}

interface SICreateScheduleExamResponse extends SIDefaultRequestResponse {
  DESCRICAOPOSMARCACAO: string;
  InformacoesAgendamento: [
    {
      ID_HORARIO: number;
      ID_PROGRAMACAO: number;
      COD_LOCAL: number;
      COD_PROFISSIONAL: number;
      ID_PROCEDIMENTO: number;
      COD_CLIENTE: number;
      DES_NOMECLIENTE: string;
      COD_CLIENTEORIGEM: number;
      DES_NOMELOCAL: string;
      DES_ENDERECO: string;
      DES_BAIRRO: string;
      DES_NOMELOCALIDADE: string;
      DES_UF: string;
      DES_TEXTODISTANCIA: string;
      COD_PROCEDIMENTO: number;
      DES_NOMEPROCEDIMENTO: string;
      DES_NOVONOMEPROCEDIMENTO: string;
      NUM_MINHORASPROXMARCACAO: number;
      DES_OBSERVACAOPRECO: string;
      DES_OBSERVACAOPRECOOFERTA: string;
      DAT_ATENDIMENTO: string;
      HOR_ATENDIMENTO: string;
      DES_TRATAMENTO: string;
      DES_NOMEPROFISSIONAL: string;
      BIN_TEXTOEXPLICATIVO: string;
      DES_SENHA: string;
      NUM_PRECOATENDIMENTO: number;
      DES_ALERTAS: string;
      EXIGECONFIRMACAOLEITURAALERTAS: boolean;
      NUM_TELEFONE: string;
      DES_CONVENIO: string;
      DES_ARQUIVOICS: string;
      COD_SEXOPROFISSIONAL: string;
      NewProperty: string;
    },
  ];
}

export {
  SIListAvailableSchedulesResponse,
  SIListAvailableSchedulesParamsRequest,
  SIPatientSchedulesResponse,
  SIPatientSchedulesParamsRequest,
  SICreateScheduleResponse,
  SICreateScheduleParamsRequest,
  SIListAvailableSchedule,
  SICancelScheduleParamsRequest,
  SiListAvailableExamsParamsRequest,
  SIListAvailableExamesResponse,
  SICreateScheduleExamParamsRequest,
  SICreateScheduleExamResponse,
  SIPatientScheduleDetailsParamsRequest,
  SIPatientScheduleDetails,
  SIPatientSchedule,
};
