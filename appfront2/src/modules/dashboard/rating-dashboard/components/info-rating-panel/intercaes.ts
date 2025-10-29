import { Rating } from '../../interfaces';

export interface InfoRatingPanelProps {
  rating: Rating;
  users: any[];
  teams: any[];
  onClose: () => void;
}

export interface TableDataType {
  key: string;
  label: string;
  value: string | null;
}
