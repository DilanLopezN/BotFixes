export interface InsuranceResponseData {
  insurancePlan?: {
    identifierCode: string;
    name: string[];
  };
  insuranceSubPlan: {
    identifierCode: string;
    name: string[];
  };
}
