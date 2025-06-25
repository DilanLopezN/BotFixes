import { ScheduleGroupRule } from '../interfaces/schedule-group-rule.enum';

export interface CreateConfirmationSettingDto {
    apiToken: string;
    scheduleSettingId: number;
    templateId: string;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    active: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}

export interface UpdateConfirmationSettingDto {
    apiToken: string;
    templateId: string;
    active: boolean;
    retryInvalid?: boolean;
    resendMsgNoMatch?: boolean;
    erpParams?: string;
    groupRule?: ScheduleGroupRule;
    sendRecipientType?: string;
    emailSendingSettingId?: number;
    sendingGroupType?: string;
}
