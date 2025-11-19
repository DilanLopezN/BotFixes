import { StenciIdentity, StenciAddress, StenciPaginatedResponse } from './common.interface';

export interface StenciCreatePatientRequest {
  name: string;
  birthDate: string; // yyyy-mm-dd
  gender: 'male' | 'female';
  identity: StenciIdentity;
  cellphone?: string;
  email?: string;
  insurancePlanId?: string;
  address?: StenciAddress;
}

export interface StenciUpdatePatientRequest {
  name?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  identity?: StenciIdentity;
  cellphone?: string;
  email?: string;
  insurancePlanId?: string;
  address?: StenciAddress;
}

export interface StenciPatientInsurance {
  id: string;
  name: string;
  fullName: string;
  plan: {
    id: string;
    name: string;
  };
}

export interface StenciPatientResponse {
  id: string;
  name: string;
  identity: StenciIdentity;
  birthDate: string;
  gender?: 'male' | 'female';
  cellphone?: string;
  email?: string;
  motherName?: string | null;
  fatherName?: string | null;
  insurance?: StenciPatientInsurance;
  address?: StenciAddress;
}

export interface StenciListPatientsParams {
  limit?: number;
  offset?: number;
  search?: string; // patient name
  active?: boolean;
  birthDate?: string; // yyyy-mm-dd
  identity?: string; // cpf, cnpj or passport
}

export type StenciPatientsResponse = StenciPaginatedResponse<StenciPatientResponse>;
