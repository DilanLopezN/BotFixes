import type { BreakTime } from '~/interfaces/break-time';

export interface BreakModalProps {
  selectedBreak?: BreakTime;
  isVisible?: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export interface BreakFormValues {
  name: string;
  durationSeconds: number;
}
