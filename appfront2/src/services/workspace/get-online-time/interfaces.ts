import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import type { BreakReport } from '~/interfaces/break-report';

export interface GetOnlineTimeProps {
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  groupDateBy?: AnalyticsInterval;
  groupBy?: AnalyticsGroupBy;
}

export interface GetOnlineTimeResponse {
  data: BreakReport;
}
