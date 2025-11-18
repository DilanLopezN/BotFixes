import { ExtractedSchedule } from '../../schedules/interfaces/extracted-schedule.interface';

export type ExtractedScheduleNotification = {
  integrationId: string;
  contextId: string;
} & ExtractedSchedule;
