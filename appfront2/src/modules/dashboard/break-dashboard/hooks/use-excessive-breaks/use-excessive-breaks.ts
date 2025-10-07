import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import {
  getExcessiveBreaks,
  type GetExcessiveBreaksResponse,
} from '~/services/workspace/get-excessive-breaks';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';
import { FetchExcessiveBreaksProps } from './interfaces';

export const useExcessiveBreaks = () => {
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [excessiveBreaks, setExcessiveBreaks] = useState<GetExcessiveBreaksResponse>();
  const [isFetchingExcessiveBreaks, setIsFetchingExcessiveBreaks] = useState(true);
  const [excessiveBreaksError, setExcessiveBreaksError] = useState<ApiError>();

  const fetchExcessiveBreaks = useCallback(
    async ({ current, pageSize }: FetchExcessiveBreaksProps) => {
      try {
        startLoading();
        setExcessiveBreaksError(undefined);
        setIsFetchingExcessiveBreaks(true);
        const response = await getExcessiveBreaks(workspaceId, {
          data: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            teamId: filters.teamId,
            userId: filters.userId,
            breakSettingId: filters.breakSettingId,
          },
          limit: pageSize,
          skip: (current - 1) * pageSize,
        });
        setExcessiveBreaks(response);
        setIsFetchingExcessiveBreaks(false);
        endLoading();
        return true;
      } catch (error) {
        notifyError('Erro ao carregar pausas excedidas');
        setExcessiveBreaksError(error as ApiError);
        setIsFetchingExcessiveBreaks(false);
        endLoading();
        return false;
      }
    },
    [
      endLoading,
      filters.breakSettingId,
      filters.endDate,
      filters.startDate,
      filters.teamId,
      filters.userId,
      startLoading,
      workspaceId,
    ]
  );

  return {
    excessiveBreaks,
    isFetchingExcessiveBreaks,
    excessiveBreaksError,
    fetchExcessiveBreaks,
  };
};
