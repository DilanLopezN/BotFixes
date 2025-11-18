export * from './patient.interface';
export * from './base-register.interface';
export * from './appointment.interface';

interface BaseResponse {
  success: boolean;
}

interface FeegowResponsePlain<T> extends BaseResponse {
  content: T;
}

interface FeegowResponseArray<T> extends BaseResponse {
  content: T[];
}

export { FeegowResponsePlain, FeegowResponseArray };
