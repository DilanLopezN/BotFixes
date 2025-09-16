import { RecipientType } from '../models/schedule-message.entity';
import { ScheduleGroupRule } from './schedule-group-rule.enum';

export interface CreateReminderSettingData {
  active: boolean;
  workspaceId: string;
  apiToken: string;
  templateId: string;
  retryInvalid?: boolean;
  sendBeforeScheduleDate?: number;
  scheduleSettingId?: number;
  erpParams?: string;
  groupRule?: ScheduleGroupRule;
  sendAction?: boolean;
  sendRecipientType?: RecipientType;
  emailSendingSettingId?: number;
  sendingGroupType?: string;
}

export interface UpdateReminderSettingData {
  id: number;
  workspaceId: string;
  active: boolean;
  templateId: string;
  apiToken: string;
  sendBeforeScheduleDate?: number;
  retryInvalid?: boolean;
  erpParams?: string;
  groupRule?: ScheduleGroupRule;
  sendAction?: boolean;
  sendRecipientType?: RecipientType;
  emailSendingSettingId?: number;
  sendingGroupType?: string;
}
