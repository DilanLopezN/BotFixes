export interface DoctorListProps {
  isVisible: boolean;
  selectedIntegrationId?: string;
  selectedDoctorCodeList: string[];
  setSelectedDoctorCodeList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
