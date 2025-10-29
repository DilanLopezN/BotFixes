import { Activity } from '../../interfaces/activity.interface';

export type MinimalActivity = Pick<Activity, 'from' | 'type' | 'text' | 'data'>;
