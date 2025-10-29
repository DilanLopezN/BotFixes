import { useEffect } from 'react';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import { useQueryString } from '~/hooks/use-query-string';
import { useProductivity } from '../../hooks/use-productivity';
import { useRefreshContext } from '../../hooks/use-refresh-context';
import { BreakDashboardQueryString } from '../../interfaces';
import { MetricColumnChart } from '../metric-column-chart';

export const OverallProductivityTab = () => {
  const { refreshKey } = useRefreshContext();
  const { queryStringAsObj } = useQueryString<BreakDashboardQueryString>();
  const { productivity, isFetchingProductivity, fetchProductivity } = useProductivity();

  useEffect(() => {
    fetchProductivity();
  }, [fetchProductivity, refreshKey]);

  return (
    <MetricColumnChart
      data={productivity || []}
      title='Produtividade geral'
      groupBy={(queryStringAsObj.groupDateBy as AnalyticsInterval) || AnalyticsInterval.Day}
      isLoading={isFetchingProductivity}
      legend='Produtividade'
    />
  );
};
