export interface SpecialityListProps {
  isVisible: boolean;
  selectedIntegrationId?: string;
  selectedSpecialityCodeList: string[];
  setSelectedSpecialityCodeList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
