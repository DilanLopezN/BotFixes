import { DoctorEntityDocument, InsuranceEntityDocument } from '../../entities/schema';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { EntityType } from '../../interfaces/entity.interface';

interface ListPatientSuggestedData {
  cpf?: string;
  bornDate?: string;
  phone?: string;
  code?: string;
  filter?: CorrelationFilter;
}

interface SuggestedPatientInsurance {
  [EntityType.insurance]?: InsuranceEntityDocument;
  [EntityType.insurancePlan]?: InsuranceEntityDocument;
  [EntityType.insuranceSubPlan]?: InsuranceEntityDocument;
  [EntityType.planCategory]?: InsuranceEntityDocument;
}

interface PatientSuggestedInsurances {
  particular: InsuranceEntityDocument[];
  principal: InsuranceEntityDocument[];
  suggested: SuggestedPatientInsurance[];
}

interface PatientSuggestedDoctors {
  principal: DoctorEntityDocument[];
  suggested: DoctorEntityDocument[];
}

export type {
  ListPatientSuggestedData,
  PatientSuggestedInsurances,
  SuggestedPatientInsurance,
  PatientSuggestedDoctors,
};
