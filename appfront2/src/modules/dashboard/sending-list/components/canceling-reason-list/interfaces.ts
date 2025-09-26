export interface CancelingReasonListProps {
  isVisible: boolean;
  selectedCancelingReasonList: string[];
  setSelectedCancelingReasonList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  description: string;
}
