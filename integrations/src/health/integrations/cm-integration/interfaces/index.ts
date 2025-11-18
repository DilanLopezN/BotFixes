export * from './patient.interface';
export * from './schedule.interface';
export * from './base-register.interface';

interface BaseResponse {
  type?: 'error' | 'result';
  error?: string;
  stack?: string;
  duration?: number;
}

export interface CMResponsePlain<T> extends BaseResponse {
  result: T;
}

export interface CMResponseArray<T> extends BaseResponse {
  result: T[];
}

export interface Authentication {
  token: string;
  email: string;
  dataValidadeToken: string;
}
