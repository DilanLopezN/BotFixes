import { FeedbackEnum } from '../../constants';

export interface FeedbackListProps {
  feedback: FeedbackEnum | null;
  setFeedback: (feedback: FeedbackEnum | null) => void;
}

export interface DataType {
  key: string;
  description: string;
}
