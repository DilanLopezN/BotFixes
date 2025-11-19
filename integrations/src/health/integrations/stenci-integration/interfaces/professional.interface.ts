import { StenciIdentity, StenciPaginatedResponse } from './common.interface';

export interface StenciProfessionalCouncil {
  name: string;
  state: string;
  record: string;
}

export interface StenciProfessionalSpecialty {
  code: string;
  name: string;
  rqe?: string;
}

export interface StenciProfessionalResponse {
  id: string;
  name: string;
  identity: StenciIdentity;
  active?: boolean;
  council: StenciProfessionalCouncil;
  specialties: StenciProfessionalSpecialty[];
}

export interface StenciListProfessionalsParams {
  limit?: number;
  offset?: number;
  search?: string; // professional name
  active?: boolean;
  specialtyCode?: string;
  insurancePlanId?: string;
}

export type StenciProfessionalsResponse = StenciPaginatedResponse<StenciProfessionalResponse>;
