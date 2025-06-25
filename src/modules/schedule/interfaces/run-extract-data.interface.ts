import * as moment from "moment";
import { ScheduleGroupRule } from "./schedule-group-rule.enum";

export interface RunExtractData {
    scheduleSetting: any;
    extract: string;
    startDate: moment.Moment;
    endDate: moment.Moment;
    erpParams?: string;
    scheduleGroupRule: ScheduleGroupRule;
    sendRecipientType: string;
    sendingGroupType: string;
    hoursBeforeScheduleDate: number;
}