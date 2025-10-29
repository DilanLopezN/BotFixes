import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import type { ApiError } from '~/interfaces/api-error';
import {
  getBreakOvertime,
  type GetBreakOvertimeResponse,
} from '~/services/workspace/get-break-overtime';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useBreakOvertime = () => {
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [breakOvertime, setBreakOvertime] = useState<GetBreakOvertimeResponse>();
  const [isFetchingBreakOvertime, setIsFetchingBreakOvertime] = useState(true);
  const [breakOvertimeError, setBreakOvertimeError] = useState<ApiError>();

  const fetchBreakOvertime = useCallback(async () => {
    try {
      startLoading();
      setBreakOvertimeError(undefined);
      setIsFetchingBreakOvertime(true);
      const response = await getBreakOvertime(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupDateBy: filters.groupDateBy as AnalyticsInterval,
        groupBy: AnalyticsGroupBy.User,
        teamId: filters.teamId,
        userId: filters.userId,
        breakSettingId: filters.breakSettingId,
      });
      endLoading();
      setBreakOvertime(response);
      setIsFetchingBreakOvertime(false);
      return true;
    } catch (error) {
      notifyError('Erro ao carregar tempo excedido');
      setBreakOvertimeError(error as ApiError);
      setIsFetchingBreakOvertime(false);
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.breakSettingId,
    filters.endDate,
    filters.groupDateBy,
    filters.startDate,
    filters.teamId,
    filters.userId,
    startLoading,
    workspaceId,
  ]);

  return {
    breakOvertime,
    isFetchingBreakOvertime,
    breakOvertimeError,
    fetchBreakOvertime,
  };
};
