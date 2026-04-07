import { StenciPaginatedResponse } from './common.interface';

export interface StenciSpecialtyResponse {
  code: string;
  name: string;
}

export interface StenciListSpecialtiesParams {
  limit?: number;
  offset?: number;
  search?: string;
  code?: string; // specialty code
}

export type StenciSpecialtiesResponse = StenciPaginatedResponse<StenciSpecialtyResponse>;
