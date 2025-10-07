import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '~/hooks/use-auth';
import type { ApiError } from '~/interfaces/api-error';
import {
  getGeneralProductivity,
  type GetGeneralProductivityResponse,
} from '~/services/workspace/get-general-productivity';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useGeneralProductivity = () => {
  const { user } = useAuth();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { startLoading, endLoading } = useRefreshContext();
  const filters = useFilters();
  const [generalProductivity, setGeneralProductivity] = useState<GetGeneralProductivityResponse>();
  const [isFetchingGeneralProductivity, setIsFetchingGeneralProductivity] = useState(true);
  const [generalProductivityError, setGeneralProductivityError] = useState<ApiError>();

  const fetchGeneralProductivity = useCallback(async () => {
    try {
      startLoading();
      setGeneralProductivityError(undefined);
      setIsFetchingGeneralProductivity(true);
      const response = await getGeneralProductivity(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        teamId: filters.teamId,
        userId: filters.userId,
        breakSettingId: filters.breakSettingId,
        timezone: user?.timezone,
      });
      setGeneralProductivity(response);
      setIsFetchingGeneralProductivity(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar produtividade geral');
      setGeneralProductivityError(error as ApiError);
      setIsFetchingGeneralProductivity(false);
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
    user?.timezone,
    workspaceId,
  ]);

  return {
    generalProductivity,
    isFetchingGeneralProductivity,
    generalProductivityError,
    fetchGeneralProductivity,
  };
};
