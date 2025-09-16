import { ConfirmationSetting } from '../../models/confirmation-setting.entity';
import { Schedule } from '../../models/schedule.entity';
import { SendSetting } from '../../models/send-setting.entity';

export interface ResultScheduleWithSendSetting extends Schedule {
  confirmationSetting?: ConfirmationSetting;
  sendSetting?: SendSetting;
}
