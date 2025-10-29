import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryString } from '~/hooks/use-query-string';
import type { ApiError } from '~/interfaces/api-error';
import {
  getScheduleAnalyticsByWorkspaceId,
  type ScheduleAnalytics,
} from '~/services/workspace/get-schedule-analytics';
import { SendingListQueryString } from '../../interfaces';
import { useFilters } from '../use-filters';

export const useScheduleAnalytics = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<SendingListQueryString>();
  const filters = useFilters();
  const [scheduleAnalytics, setScheduleAnalytics] = useState<ScheduleAnalytics>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const { startDate, endDate } = queryStringAsObj;

  useEffect(() => {
    const fetchDate = async () => {
      if (!workspaceId || !startDate || !endDate) {
        return;
      }

      try {
        setIsLoading(true);
        const list = await getScheduleAnalyticsByWorkspaceId(filters);
        setScheduleAnalytics(list);
      } catch (err) {
        setError(err as ApiError);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDate();
  }, [endDate, filters, startDate, workspaceId]);

  return { scheduleAnalytics, isLoading, error };
};
