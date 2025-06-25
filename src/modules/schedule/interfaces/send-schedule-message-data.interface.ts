import { ActiveMessageInternalActions } from '../../active-message/interfaces/active-message-internal-actions';
import { ScheduleGroupRule } from './schedule-group-rule.enum';
export interface SendScheduleMessageSetting {
    id?: number;
    apiToken: string;
    templateId: string;
    retryInvalid?: boolean;
    groupRule?: ScheduleGroupRule;
    erpParams?: string;
    sendAction?: boolean;
    emailSendingSettingId?: number;
}
export interface SendScheduleMessageData {
    scheduleMessage: any;
    schedule: any;
    sendScheduleMessageSetting: SendScheduleMessageSetting;
    action: ActiveMessageInternalActions;
}
