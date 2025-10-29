import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import type { BreakReport } from '~/interfaces/break-report';

export interface GetBreakOvertimeProps {
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  groupDateBy?: AnalyticsInterval;
  groupBy?: AnalyticsGroupBy;
  breakSettingId?: number | null;
}

export interface GetBreakOvertimeResponse {
  data: BreakReport;
}
