import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import type { ApiError } from '~/interfaces/api-error';
import { getOnlineTime, type GetOnlineTimeResponse } from '~/services/workspace/get-online-time';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useOnlineTime = () => {
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [onlineTime, setOnlineTime] = useState<GetOnlineTimeResponse>();
  const [isFetchingOnlineTime, setIsFetchingOnlineTime] = useState(true);
  const [onlineTimeError, setOnlineTimeError] = useState<ApiError>();

  const fetchOnlineTime = useCallback(async () => {
    try {
      startLoading();
      setOnlineTimeError(undefined);
      setIsFetchingOnlineTime(true);
      const response = await getOnlineTime(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupDateBy: filters.groupDateBy as AnalyticsInterval,
        groupBy: AnalyticsGroupBy.User,
        teamId: filters.teamId,
        userId: filters.userId,
      });
      setOnlineTime(response);
      setIsFetchingOnlineTime(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar gráfico de tempo online');
      setOnlineTimeError(error as ApiError);
      setIsFetchingOnlineTime(false);
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.endDate,
    filters.groupDateBy,
    filters.startDate,
    filters.teamId,
    filters.userId,
    startLoading,
    workspaceId,
  ]);

  return {
    onlineTime,
    isFetchingOnlineTime,
    onlineTimeError,
    fetchOnlineTime,
  };
};
