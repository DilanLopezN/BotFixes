import { AnalyticsInterval } from '~/constants/analytics-interval';
import type { BreakReport } from '~/interfaces/break-report';

export interface GetProductivityProps {
  interval?: AnalyticsInterval;
  workspaceId?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  teamId?: string;
  userId?: string;
  breakSettingId?: number | null;
}

export type GetProductivityResponse = BreakReport;
