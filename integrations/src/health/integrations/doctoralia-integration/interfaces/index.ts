export * from './patient.interface';
export * from './base-register.interface';

interface BaseResponse {
  result?: 'OK' | 'ERROR' | 'EXCEPTION' | 'WARNING';
  msg?: string;
  exception?: string;
  execution_time?: number;
  debug?: string;
  net_execution_time?: number;
  additional_return?: any;
}

interface DoctoraliaResponsePlain<T, P = any> extends BaseResponse {
  return: T;
  additional_return: P;
}

interface DoctoraliaResponseArray<T> extends BaseResponse {
  return: {
    results: T;
  };
}

export { DoctoraliaResponsePlain, DoctoraliaResponseArray };
