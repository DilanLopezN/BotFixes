import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import {
  getTotalOnlineTime,
  type GetTotalOnlineTimeResponse,
} from '~/services/workspace/get-total-online-time';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useTotalOnlineTime = () => {
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [totalOnlineTime, setTotalOnlineTime] = useState<GetTotalOnlineTimeResponse>();
  const [isFetchingTotalOnlineTime, setIsFetchingTotalOnlineTime] = useState(true);
  const [totalOnlineTimeError, setTotalOnlineTimeError] = useState<ApiError>();

  const fetchTotalOnlineTime = useCallback(async () => {
    try {
      startLoading();
      setTotalOnlineTimeError(undefined);
      setIsFetchingTotalOnlineTime(true);
      const response = await getTotalOnlineTime(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        teamId: filters.teamId,
        userId: filters.userId,
      });
      setTotalOnlineTime(response);
      setIsFetchingTotalOnlineTime(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar tempo total online');
      setTotalOnlineTimeError(error as ApiError);
      setIsFetchingTotalOnlineTime(false);
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.endDate,
    filters.startDate,
    filters.teamId,
    filters.userId,
    startLoading,
    workspaceId,
  ]);

  return {
    totalOnlineTime,
    isFetchingTotalOnlineTime,
    totalOnlineTimeError,
    fetchTotalOnlineTime,
  };
};
