export interface StatusListProps {
  selectedStatusList: string[];
  setSelectedStatusList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
