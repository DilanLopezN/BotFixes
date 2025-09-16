import { ExtractResumeType } from '../models/extract-resume.entity';
import { RecipientType } from '../models/schedule-message.entity';
import { ScheduleGroupRule } from './schedule-group-rule.enum';

export interface CreateSendSettingData {
  type: ExtractResumeType;
  active: boolean;
  workspaceId: string;
  apiToken: string;
  templateId: string;
  scheduleSettingId?: number;
  retryInvalid?: boolean;
  resendMsgNoMatch?: boolean;
  hoursBeforeScheduleDate?: number;
  erpParams?: string;
  groupRule?: ScheduleGroupRule;
  sendAction?: boolean;
  sendRecipientType?: RecipientType;
  emailSendingSettingId?: number;
  sendingGroupType?: string;
}

export interface UpdateSendSettingData {
  id: number;
  active: boolean;
  type: ExtractResumeType;
  workspaceId: string;
  apiToken: string;
  templateId: string;
  scheduleSettingId: number;
  retryInvalid?: boolean;
  resendMsgNoMatch?: boolean;
  hoursBeforeScheduleDate?: number;
  erpParams?: string;
  groupRule?: ScheduleGroupRule;
  sendAction?: boolean;
  sendRecipientType?: RecipientType;
  emailSendingSettingId?: number;
  sendingGroupType?: string;
}
