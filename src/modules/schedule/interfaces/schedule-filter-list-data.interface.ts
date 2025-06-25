import { ScheduleFilterListDto } from "../dto/schedule-query.dto";

export interface ScheduleFilterListData extends ScheduleFilterListDto {
    workspaceId: string;
}