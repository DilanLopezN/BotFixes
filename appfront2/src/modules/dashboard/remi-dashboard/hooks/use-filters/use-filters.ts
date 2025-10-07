import { useMemo } from 'react';
import { useQueryString } from '~/hooks/use-query-string';
import type { RemiDashboardQueryString } from '../../interfaces';

export const useFilters = () => {
  const { queryStringAsObj } = useQueryString<RemiDashboardQueryString>();

  const { startDate, endDate } = queryStringAsObj;

  const remiIdList = useMemo(() => {
    return queryStringAsObj.remiIdList?.split(',');
  }, [queryStringAsObj.remiIdList]);

  const filters = useMemo(() => {
    return {
      startDate,
      endDate,
      remiIdList,
    };
  }, [endDate, remiIdList, startDate]);

  return filters;
};
