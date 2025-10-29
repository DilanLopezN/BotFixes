import type { GetRemiReportsResponse } from '~/services/workspace/get-remi-reports';

export interface BarChartProps {
  isLoading?: boolean;
  remiReports?: GetRemiReportsResponse;
}
