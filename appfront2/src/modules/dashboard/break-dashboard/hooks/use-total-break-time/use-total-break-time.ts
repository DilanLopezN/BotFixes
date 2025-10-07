import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import {
  getTotalBreakTime,
  type GetTotalBreakTimeResponse,
} from '~/services/workspace/get-total-break-time';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useTotalBreakTime = () => {
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [totalBreakTime, setTotalBreakTime] = useState<GetTotalBreakTimeResponse>();
  const [isFetchingTotalBreakTime, setIsFetchingTotalBreakTime] = useState(true);
  const [totalBreakTimeError, setTotalBreakTimeError] = useState<ApiError>();

  const fetchTotalBreakTime = useCallback(async () => {
    try {
      startLoading();
      setTotalBreakTimeError(undefined);
      setIsFetchingTotalBreakTime(true);
      const response = await getTotalBreakTime(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        teamId: filters.teamId,
        userId: filters.userId,
        breakSettingId: filters.breakSettingId,
      });
      setTotalBreakTime(response);
      setIsFetchingTotalBreakTime(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar tempo de pausa');
      setTotalBreakTimeError(error as ApiError);
      setIsFetchingTotalBreakTime(false);
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.endDate,
    filters.breakSettingId,
    filters.startDate,
    filters.teamId,
    filters.userId,
    startLoading,
    workspaceId,
  ]);

  return {
    totalBreakTime,
    isFetchingTotalBreakTime,
    totalBreakTimeError,
    fetchTotalBreakTime,
  };
};
