import { InsuranceEntityDocument } from '../../entities/schema';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export interface EntitiesFromInsurance {
  insurance: InsuranceEntityDocument;
  filter: CorrelationFilter;
  patient: {
    cpf: string;
    bornDate: string;
    sex?: string;
  };
}
