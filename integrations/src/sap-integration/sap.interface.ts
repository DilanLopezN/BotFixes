import { DebugRequest } from 'kissbot-health-core';

export interface AwsFilesResponse {
  ZMMF_CB_CONTRATO_table: string;
  ZMMF_CB_ENVIO_table: string;
  ZMMF_CB_LOGON_table: string;
}

export interface GetStatusResponse {
  status: string[];
  contractNumber?: string;
}
export interface MessageStatus {
  status: string[];
}

export interface SapUserNotification {
  id: string;
  contractNumber: string;
  userPhoneNumber: string;
  notificationDate?: string;
  warningBalance?: boolean;
  warningExpiration?: boolean;
}

export interface ZMMF_CB_CONTRATO {
  FORMULA: string;
  EBELN: string;
  EBELP: string;
  EKGRP: string;
  EKNAM: string;
  KDATB: string;
  KDATE: string;
  KTWRT: string;
  LIFNR: string;
  LOEKZ: string;
  MANDT: string;
  NAME1: string;
  ZDATE: string;
  ZTIME: string;
  FRGGR: string;
  FRGSX: string;
  FRGKE: string;
  FRGZU: string;
  FRGRL: string;
  ERNAM: string;
}

export interface ZMMF_CB_LOGON {
  MANDT: string;
  BNAME: string;
  TEL_NUMBER: string;
  NOME_COMPLETO: string;
  CLASS: string;
  TEMPO_LOGIN: string;
  ZDATE: string;
  ZTIME: string;
}

export interface ZMMF_CB_ENVIO {
  MANDT: string;
  BANFN: string;
  BNFPO: string;
  BSART: string;
  EBELN: string;
  EBELP: string;
  LIFNR: string;
  NAME1: string;
  MENGE_PO: string;
  MENGE_RC: string;
  VALTT_PO_ITEM: string;
  VALTT_RC_ITEM: string;
  KONNR: string;
  EKORG: string;
  KNTTP: string;
  AUFNR: string;
  CENTRO_CUSTO: string;
  ESTOQUE: string;
  CREATIONDATE_RC: string;
  CREATIONDATE_PO: string;
  LFDAT: string;
  EINDT: string;
  ERNAM: string;
  EKGRP: string;
  EKNAM_GRP: string;
  ERNAM_PO: string;
  ZDATS_APROV_RC: string;
  FRGKZ: string;
  FRGZU_RC: string;
  FRGST: string;
  USR_APROVA_RC: string;
  NAME_USR_A_RC: string;
  LOEKZ_RC: string;
  ZDATS_ELIM_RC: string;
  ZUSER_ELIM_RC: string;
  ZNAME_ELIM_RC: string;
  FRGGR: string;
  FRGSX: string;
  FRGKE: string;
  FRGZU_PO: string;
  FRGRL: string;
  ZDATS_APROV_PO: string;
  USR_APROVA_PO: string;
  NAME_USR_A_PO: string;
  LOEKZ_PO: string;
  ZDATS_ELIM_PO: string;
  ZUSER_ELIM_PO: string;
  ZNAME_ELIM_PO: string;
  MENGE: string;
  MEINS: string;
  MATNR: string;
  TXZ01: string;
  LFBNR: string;
  ZDATE: string;
  ZTIME: string;
  KTPNR: string;
}

export interface TABLE {
  dataCarga: string;
  ET_DATA: ZMMF_CB_CONTRATO[] | ZMMF_CB_LOGON[] | ZMMF_CB_ENVIO[];
}
