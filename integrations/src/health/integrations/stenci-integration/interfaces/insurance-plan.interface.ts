import { StenciPaginatedResponse } from './common.interface';

export type StenciInsurancePlanType = 'insurance' | 'particular' | 'referral';

export interface StenciInsurancePlanInsurance {
  id: string;
  name: string;
}

export interface StenciInsurancePlanResponse {
  id: string;
  name: string;
  type: StenciInsurancePlanType;
  record: string | null;
  insurance: StenciInsurancePlanInsurance;
  active: boolean;
  fullName: string;
}

export interface StenciListInsurancePlansParams {
  limit?: number;
  offset?: number;
  search?: string; // insurance or plan name
  active?: boolean;
  type?: StenciInsurancePlanType;
  record?: string;
  serviceId?: string;
}

export type StenciInsurancePlansResponse = StenciPaginatedResponse<StenciInsurancePlanResponse>;
