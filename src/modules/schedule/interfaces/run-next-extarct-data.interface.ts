import { ScheduleGroupRule } from './schedule-group-rule.enum';

export interface RunNextExtractData {
    scheduleSetting: any;
    type: string;
    hoursBeforeScheduleDate: number;
    settingTypeId: number;
    erpParams?: string;
    scheduleGroupRule: ScheduleGroupRule;
    extractStartDate?: Date;
    extractEndDate?: Date;
    extractRuleParam?: string;
}
