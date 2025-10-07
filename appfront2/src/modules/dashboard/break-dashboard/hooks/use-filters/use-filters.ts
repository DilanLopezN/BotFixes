import dayjs from 'dayjs';
import { useMemo } from 'react';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import { useQueryString } from '~/hooks/use-query-string';
import type { BreakDashboardQueryString } from '../../interfaces';

export const useFilters = () => {
  const { queryStringAsObj } = useQueryString<BreakDashboardQueryString>();

  const { startDate, endDate, isRealtime, groupDateBy, teamId, userId, breakSettingId } =
    queryStringAsObj;

  const filters = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const isRealTimeActive = isRealtime === 'true';

    const resolvedStartDate = isRealTimeActive ? today : startDate;
    const resolvedEndDate = isRealTimeActive ? today : endDate;
    const resolvedGroupDateBy = isRealTimeActive ? AnalyticsInterval.Day : groupDateBy;

    return {
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      groupDateBy: resolvedGroupDateBy,
      teamId,
      userId,
      breakSettingId: breakSettingId ? Number(breakSettingId) : null,
    };
  }, [breakSettingId, endDate, groupDateBy, isRealtime, startDate, teamId, userId]);

  return filters;
};
