import { feedbackEnum } from '../constants';

export interface FeedbackProps {
  feedback: feedbackEnum | null;
  setFeedback: (feedback: feedbackEnum | null) => void;
}
