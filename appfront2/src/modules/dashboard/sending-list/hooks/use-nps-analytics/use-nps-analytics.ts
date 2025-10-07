import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import type { NpsAnalytic } from '~/services/workspace/get-nps-analytics';
import { getNpsAnalyticsByWorkspaceId } from '~/services/workspace/get-nps-analytics/get-nps-analytics';
import { SendingListQueryString } from '../../interfaces';
import { useFilters } from '../use-filters';

export const useNpsAnalytics = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const filters = useFilters();
  const [npsAnalytics, setNpsAnalytics] = useState<NpsAnalytic[]>();
  const [isLoadingNpsAnalytics, setIsLoadingNpsAnalytics] = useState(true);
  const [npsAnalyticsError, setNpsAnalyticsError] = useState<ApiError>();

  const { startDate, endDate } = queryStringAsObj;

  useEffect(() => {
    const fetchDate = async () => {
      if (!workspaceId || !startDate || !endDate) {
        return;
      }

      try {
        setIsLoadingNpsAnalytics(true);
        const list = await getNpsAnalyticsByWorkspaceId(filters);
        setNpsAnalytics(list);
      } catch (err) {
        setNpsAnalyticsError(err as ApiError);
      } finally {
        setIsLoadingNpsAnalytics(false);
      }
    };
    fetchDate();
  }, [endDate, filters, startDate, workspaceId]);

  return { npsAnalytics, isLoadingNpsAnalytics, npsAnalyticsError };
};
