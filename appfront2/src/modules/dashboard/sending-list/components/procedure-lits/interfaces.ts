export interface ProcedureListProps {
  isVisible: boolean;
  selectedIntegrationId?: string;
  selectedProcedureList: string[];
  setSelectedProcedureList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
