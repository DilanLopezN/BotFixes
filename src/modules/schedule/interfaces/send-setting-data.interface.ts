import { ScheduleGroupRule } from './schedule-group-rule.enum';

export interface CreateSendSettingData {
    type: string;
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
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateSendSettingData {
    id: number;
    // active: boolean;
    type: string;
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
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}
