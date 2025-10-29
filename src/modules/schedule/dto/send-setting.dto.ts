import { ScheduleGroupRule } from '../interfaces/schedule-group-rule.enum';

export interface CreateSendSettingDto {
    apiToken: string;
    scheduleSettingId: number;
    hoursBeforeScheduleDate?: number;
    templateId: string;
    active: boolean;
    type: string;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateSendSettingDto {
    apiToken: string;
    templateId: string;
    // active: boolean;
    sendBeforeScheduleDate?: number;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendAction?: boolean;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}
