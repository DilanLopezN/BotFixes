export * from './patient.interface';
export * from './appointment.interface';
export * from './base-register.interface';
export * from './auth.interface';
export * from './entities.interface';
export * from './confirmation-cancel-erp-params.interface';

interface ClinicResponse<T> {
  result: T;
}

interface ClinicResponseArray<T> {
  result: {
    items: T[];
  };
}

export { ClinicResponse, ClinicResponseArray };
