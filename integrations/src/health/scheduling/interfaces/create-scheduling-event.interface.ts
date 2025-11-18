import { IScheduleEvents } from './scheduling-events.interface';

export type CreateSchedulingEvent = Pick<IScheduleEvents, 'type' | 'integrationId' | 'shortId' | 'scheduleCode'>;
