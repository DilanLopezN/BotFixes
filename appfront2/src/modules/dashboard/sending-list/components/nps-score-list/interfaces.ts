export interface NpsScoreListProps {
  selectedNpsScoreList: string[];
  setSelectedNpsScoreList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  score: string;
}
