import { StenciPaginatedResponse } from './common.interface';

export type StenciServiceType =
  | 'canteen'
  | 'consultation'
  | 'daily'
  | 'evaluation'
  | 'exam'
  | 'gas'
  | 'laboratory'
  | 'material'
  | 'medicine'
  | 'others'
  | 'physiotherapy'
  | 'procedure'
  | 'service'
  | 'session'
  | 'surgery'
  | 'tax';

export interface StenciServiceTuss {
  code: string;
  name: string;
}

export interface StenciServiceSpecialty {
  code: string;
  name: string;
}

export interface StenciServiceResponse {
  id: string;
  name: string;
  type: StenciServiceType;
  tuss: StenciServiceTuss;
  specialty: StenciServiceSpecialty;
  active: boolean;
}

export interface StenciListProceduresParams {
  limit?: number;
  offset?: number;
  search?: string; // service name, tuss name or tuss code
  active?: boolean;
  type?: StenciServiceType;
  specialtyCode?: string;
  insurancePlanId?: string;
}

export type StenciListProceduresResponse = StenciPaginatedResponse<StenciServiceResponse>;
