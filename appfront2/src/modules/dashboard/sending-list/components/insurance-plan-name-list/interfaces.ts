export interface InsurancePlanNameListProps {
  isVisible: boolean;
  selectedIntegrationId?: string;
  selectedInsurancePlanNameList: string[];
  setSelectedInsurancePlanNameList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
