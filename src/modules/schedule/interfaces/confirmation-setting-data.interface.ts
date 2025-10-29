import { ScheduleGroupRule } from './schedule-group-rule.enum';

export interface CreateConfirmationSettingData {
    active: boolean;
    workspaceId: string;
    apiToken: string;
    templateId: string;
    sendWhatsBeforeScheduleDate?: number;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    scheduleSettingId?: number;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateConfirmationSettingData {
    id: number;
    workspaceId: string;
    // active: boolean;
    templateId: string;
    apiToken: string;
    sendWhatsBeforeScheduleDate?: number;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}
