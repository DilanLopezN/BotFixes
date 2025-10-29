// import { Dayjs } from 'dayjs';

export interface DayOff {
  cannotAssignEndConversation?: boolean;
  end: number;
  message?: string;
  name: string;
  start: number;
  // createdAt?: Dayjs;
}
