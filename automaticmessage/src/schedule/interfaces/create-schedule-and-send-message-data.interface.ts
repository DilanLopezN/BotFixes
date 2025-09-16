import { ExtractResumeType } from '../models/extract-resume.entity';
import { RecipientType } from '../models/schedule-message.entity';
import { Schedule } from '../models/schedule.entity';
import { SendSchedule } from '../services/integration-api.service';

export interface CreateScheduleAndScheduleMessageData {
  schedule: Partial<Schedule>;
  phoneList: string[];
  emailList: string[];
  apiKey: string;
  extractResumeType: ExtractResumeType;
  settingTypeId: number;
  sendRecipientType: RecipientType;
  sendingGroupType: string;
  orderedGroup?: Array<SendSchedule>;
}
