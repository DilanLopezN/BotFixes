import { IPatientData } from './patient.interface';

export type CreatePatient = Pick<
  IPatientData,
  'name' | 'erpCode' | 'cpf' | 'phone' | 'email' | 'erpLegacyCode' | 'workspaceId'
> & {
  bornDate: string;
};
