import * as moment from 'dayjs';
import { ExtractResume } from '../models/extract-resume.entity';
import { ScheduleSetting } from '../models/schedule-setting.entity';
import { ScheduleGroupRule } from './schedule-group-rule.enum';
import { RecipientType } from '../models/schedule-message.entity';

export interface RunExtractData {
  scheduleSetting: ScheduleSetting;
  extract: ExtractResume;
  startDate: moment.Dayjs;
  endDate: moment.Dayjs;
  erpParams?: string;
  scheduleGroupRule: ScheduleGroupRule;
  sendRecipientType: RecipientType;
  sendingGroupType: string;
  hoursBeforeScheduleDate: number;
}
