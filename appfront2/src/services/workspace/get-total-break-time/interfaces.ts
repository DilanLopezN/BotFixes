import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';

export interface GetTotalBreakTimeProps {
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  groupDateBy?: AnalyticsInterval;
  groupBy?: AnalyticsGroupBy;
  breakSettingId?: number | null;
}

export interface GetTotalBreakTimeResponse {
  data: { total: number };
}
