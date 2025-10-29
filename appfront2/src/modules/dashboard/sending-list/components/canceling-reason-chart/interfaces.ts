import type { CancelingReasonMetric } from '~/interfaces/canceling-reason-metric';

export interface CancelingReasonChartProps {
  title: string;
  data?: CancelingReasonMetric[];
  isLoading?: boolean;
}
