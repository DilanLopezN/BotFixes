import { AnalyticsInterval } from '~/constants/analytics-interval';

export interface GetGeneralProductivityProps {
  interval?: AnalyticsInterval;
  workspaceId?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  teamId?: string;
  userId?: string;
  breakSettingId?: number | null;
}

export interface GetGeneralProductivityResponse {
  data: { total: string };
}
