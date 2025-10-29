import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';

export interface GetTotalOnlineTimeProps {
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  groupDateBy?: AnalyticsInterval;
  groupBy?: AnalyticsGroupBy;
}

export interface GetTotalOnlineTimeResponse {
  data: { total: number };
}
