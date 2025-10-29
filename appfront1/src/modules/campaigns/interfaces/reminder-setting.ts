import { RecipientType, ScheduleGroupRule } from "./confirmation-setting";

export interface ReminderSetting {
    id: number;
    templateId: string;
    active: boolean;
    apiToken: string;
    workspaceId: string;
    sendBeforeScheduleDate?: number;
    scheduleSettingId: number;
    retryInvalid?: boolean
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: RecipientType;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface CreateReminderSetting {
    active: boolean;
    templateId: string;
    apiToken: string;
    sendBeforeScheduleDate?: number;
    scheduleSettingId?: number;
    retryInvalid?: boolean
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: RecipientType;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateReminderSetting extends ReminderSetting{}
