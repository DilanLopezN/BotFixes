import { ScheduleGroupRule } from '../interfaces/schedule-group-rule.enum';

export interface CreateReminderSettingDto {
    apiToken: string;
    scheduleSettingId: number;
    sendBeforeScheduleDate?: number;
    templateId: string;
    active: boolean;
    retryInvalid?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateReminderSettingDto {
    apiToken: string;
    templateId: string;
    active: boolean;
    sendBeforeScheduleDate?: number;
    retryInvalid?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}
