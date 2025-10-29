import { useEffect } from 'react';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import { useQueryString } from '~/hooks/use-query-string';
import { useBreakOvertime } from '../../hooks/use-break-overtime';
import type { BreakDashboardQueryString } from '../../interfaces';
import { MetricLineChart } from '../metric-line-chart';
import { useRefreshContext } from '../../hooks/use-refresh-context';

export const ExceedTimeTab = () => {
  const { refreshKey } = useRefreshContext();
  const { queryStringAsObj } = useQueryString<BreakDashboardQueryString>();
  const { breakOvertime, isFetchingBreakOvertime, fetchBreakOvertime } = useBreakOvertime();

  useEffect(() => {
    fetchBreakOvertime();
  }, [fetchBreakOvertime, refreshKey]);

  return (
    <MetricLineChart
      data={breakOvertime?.data}
      title='Tempo excedido'
      groupBy={(queryStringAsObj.groupDateBy as AnalyticsInterval) || AnalyticsInterval.Day}
      legend='Tempo excedido'
      isLoading={isFetchingBreakOvertime}
    />
  );
};
