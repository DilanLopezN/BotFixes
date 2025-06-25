import { ActiveMessageInternalActions } from "../../active-message/interfaces/active-message-internal-actions";
import { SendScheduleMessageSetting } from "./send-schedule-message-data.interface";

export interface CreateBatchScheduleMessageAndSendData {
    scheduleMessageList: any[];
    schedule: any;
    sendScheduleMessageSetting: SendScheduleMessageSetting;
    action: ActiveMessageInternalActions;
    sendRecipientType: string;
}