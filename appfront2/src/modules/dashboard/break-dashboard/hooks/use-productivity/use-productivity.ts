import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import { useAuth } from '~/hooks/use-auth';
import type { ApiError } from '~/interfaces/api-error';
import {
  getProductivity,
  type GetProductivityResponse,
} from '~/services/workspace/get-productivity';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useProductivity = () => {
  const { user } = useAuth();
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [productivity, setProductivity] = useState<GetProductivityResponse>();
  const [isFetchingProductivity, setIsFetchingProductivity] = useState(true);
  const [productivityError, setProductivityError] = useState<ApiError>();

  const fetchProductivity = useCallback(async () => {
    try {
      startLoading();
      setProductivityError(undefined);
      setIsFetchingProductivity(true);
      const response = await getProductivity(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        interval: filters.groupDateBy as AnalyticsInterval,
        teamId: filters.teamId,
        userId: filters.userId,
        breakSettingId: filters.breakSettingId,
        timezone: user?.timezone,
      });
      setProductivity(response);
      setIsFetchingProductivity(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar gráfico de produtividade');
      setProductivityError(error as ApiError);
      setIsFetchingProductivity(false);
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.endDate,
    filters.groupDateBy,
    filters.breakSettingId,
    filters.startDate,
    filters.teamId,
    filters.userId,
    startLoading,
    user?.timezone,
    workspaceId,
  ]);

  return {
    productivity,
    isFetchingProductivity,
    productivityError,
    fetchProductivity,
  };
};
