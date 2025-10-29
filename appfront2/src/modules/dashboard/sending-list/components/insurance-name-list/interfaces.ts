export interface InsuranceNameListProps {
  isVisible: boolean;
  selectedIntegrationId?: string;
  selectedInsuranceNameList: string[];
  setSelectedInsuranceNameList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
