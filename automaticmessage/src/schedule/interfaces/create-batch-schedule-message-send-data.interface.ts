import {
  RecipientType,
  ScheduleMessage,
} from '../models/schedule-message.entity';
import { Schedule } from '../models/schedule.entity';
import { SendSchedule } from '../services/integration-api.service';
import { ActiveMessageInternalActions, SendScheduleMessageSetting } from './send-schedule-message-data.interface';

export interface CreateBatchScheduleMessageAndSendData {
  scheduleMessageList: ScheduleMessage[];
  schedule: Schedule;
  sendScheduleMessageSetting: SendScheduleMessageSetting;
  action: ActiveMessageInternalActions;
  sendRecipientType: RecipientType;
  orderedGroup?: Array<SendSchedule>;
}
