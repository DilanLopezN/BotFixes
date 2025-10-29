import { AnalyticsInterval } from '~/constants/analytics-interval';
import type { BreakReport } from '~/interfaces/break-report';

export interface MetricLineChartProps {
  data?: BreakReport;
  title: string;
  groupBy: AnalyticsInterval;
  isLoading?: boolean;
  legend: string;
}
