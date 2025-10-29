import type { Dayjs } from 'dayjs';
import type { Dispatch, SetStateAction } from 'react';
import type { DayOff } from '~/interfaces/day-off';

export interface DayOffModalProps {
  isVisible: boolean;
  selectedDayOff?: DayOff;
  selectedDayOffIndex?: number;
  onClose: () => void;
  setDayOffList: Dispatch<SetStateAction<DayOff[]>>;
}

export interface DayOffFormValues {
  name: string;
  message?: string;
  period: [Dayjs, Dayjs];
  cannotAssignEndConversation?: boolean;
  createdAt?: Dayjs;
}
