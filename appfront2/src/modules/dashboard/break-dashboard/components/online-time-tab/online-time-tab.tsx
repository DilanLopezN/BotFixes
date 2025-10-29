import { useEffect } from 'react';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import { useQueryString } from '~/hooks/use-query-string';
import { useOnlineTime } from '../../hooks/use-online-time';
import type { BreakDashboardQueryString } from '../../interfaces';
import { MetricLineChart } from '../metric-line-chart';
import { useRefreshContext } from '../../hooks/use-refresh-context';

export const OnlineTimeTab = () => {
  const { refreshKey } = useRefreshContext();
  const { queryStringAsObj } = useQueryString<BreakDashboardQueryString>();
  const { onlineTime, isFetchingOnlineTime, fetchOnlineTime } = useOnlineTime();

  useEffect(() => {
    fetchOnlineTime();
  }, [fetchOnlineTime, refreshKey]);

  return (
    <MetricLineChart
      data={onlineTime?.data}
      title='Tempo online'
      groupBy={(queryStringAsObj.groupDateBy as AnalyticsInterval) || AnalyticsInterval.Day}
      isLoading={isFetchingOnlineTime}
      legend='Tempo online'
    />
  );
};
