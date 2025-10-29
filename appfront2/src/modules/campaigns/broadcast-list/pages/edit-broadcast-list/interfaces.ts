import { Dayjs } from 'dayjs';

export interface BroadcastListFormValues {
  name?: string;
  activeMessageSettingId?: number;
  templateId?: string;
  sendAt: Dayjs;
  immediateStart?: boolean;
  action?: string;
  isTest?: boolean;
}
