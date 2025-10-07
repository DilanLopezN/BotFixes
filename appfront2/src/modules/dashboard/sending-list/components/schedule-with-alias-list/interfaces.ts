export interface NpsScoreListProps {
  selectedScheduleSettingWithAliasList: string[];
  setSelectedScheduleSettingWithAliasList: (keyList: string[]) => void;
}

export interface DataType {
  key: string;
  alias: string;
}
