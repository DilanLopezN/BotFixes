import { Dayjs } from 'dayjs';

export interface Period {
  start: Dayjs;
  end: Dayjs;
  isDisabled?: boolean;
}

export interface TeamFormValues {
  name: string;
  priority: number;
  reassignConversationInterval: number;
  notificationNewAttendance: boolean;
  canReceiveTransfer: boolean;
  viewPublicDashboard: boolean;
  attendancePeriods: {
    mon: Period[];
    tue: Period[];
    wed: Period[];
    thu: Period[];
    fri: Period[];
    sat: Period[];
    sun: Period[];
  };
  requiredConversationCategorization?: boolean;
  assignMessage: string;
  cannotAssignMessage: string;
  cannotAssignEndConversation: boolean;
}
