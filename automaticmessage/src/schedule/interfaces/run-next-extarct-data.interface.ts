import { ExtractResumeType } from '../models/extract-resume.entity';
import {
  ExtractRule,
  ScheduleSetting,
} from '../models/schedule-setting.entity';
import { ScheduleGroupRule } from './schedule-group-rule.enum';

export interface RunNextExtractData {
  scheduleSetting: ScheduleSetting;
  type: ExtractResumeType;
  hoursBeforeScheduleDate: number;
  settingTypeId: number;
  erpParams?: string;
  scheduleGroupRule: ScheduleGroupRule;
  extractStartDate?: Date;
  extractEndDate?: Date;
  extractRuleParam?: ExtractRule;
}
