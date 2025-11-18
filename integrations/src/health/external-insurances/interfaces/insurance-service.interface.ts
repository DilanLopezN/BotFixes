import { InsuranceResponseData } from './data-response.interface';

export interface IInsuranceImplementorService {
  getData(cpf: string): Promise<InsuranceResponseData>;
}
