import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';

export interface GetTotalBreakOvertimeProps {
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  groupDateBy?: AnalyticsInterval;
  groupBy?: AnalyticsGroupBy;
  breakSettingId?: number | null;
}

export interface GetTotalBreakOvertimeResponse {
  data: { total: number };
}
