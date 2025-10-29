import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import {
  getTotalBreakOvertime,
  type GetTotalBreakOvertimeResponse,
} from '~/services/workspace/get-total-break-overtime';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useTotalBreakOvertime = () => {
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [totalBreakOvertime, setTotalBreakOvertime] = useState<GetTotalBreakOvertimeResponse>();
  const [isFetchingTotalBreakOvertime, setIsFetchingTotalBreakOvertime] = useState(true);
  const [totalBreakOvertimeError, setTotalBreakOvertimeError] = useState<ApiError>();

  const fetchTotalBreakOvertime = useCallback(async () => {
    try {
      startLoading();
      setTotalBreakOvertimeError(undefined);
      setIsFetchingTotalBreakOvertime(true);
      const response = await getTotalBreakOvertime(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        teamId: filters.teamId,
        userId: filters.userId,
        breakSettingId: filters.breakSettingId,
      });
      setTotalBreakOvertime(response);
      setIsFetchingTotalBreakOvertime(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar tempo total excedido');
      setTotalBreakOvertimeError(error as ApiError);
      setIsFetchingTotalBreakOvertime(false);
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.breakSettingId,
    filters.endDate,
    filters.startDate,
    filters.teamId,
    filters.userId,
    startLoading,
    workspaceId,
  ]);

  return {
    totalBreakOvertime,
    isFetchingTotalBreakOvertime,
    totalBreakOvertimeError,
    fetchTotalBreakOvertime,
  };
};
