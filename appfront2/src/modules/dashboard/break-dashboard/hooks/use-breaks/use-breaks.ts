import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { BreakTime } from '~/interfaces/break-time';
import { getBreaks } from '~/services/workspace/get-breaks';
import { notifyError } from '~/utils/notify-error';
import { useRefreshContext } from '../use-refresh-context';

export const useBreaks = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { startLoading, endLoading } = useRefreshContext();
  const [breaks, setBreaks] = useState<BreakTime[]>();
  const [isFetchingBreaks, setIsFetchingBreaks] = useState(true);
  const [fetchBreaksError, setFetchBreaksError] = useState<ApiError>();

  const fetchBreaks = useCallback(async () => {
    try {
      startLoading();
      setFetchBreaksError(undefined);
      setIsFetchingBreaks(true);
      const response = await getBreaks(workspaceId, {});
      setBreaks(response.data);
      setIsFetchingBreaks(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar pausas');
      setFetchBreaksError(error as ApiError);
      setIsFetchingBreaks(false);
      endLoading();
      return false;
    }
  }, [endLoading, startLoading, workspaceId]);

  return {
    breaks,
    isFetchingBreaks,
    fetchBreaksError,
    fetchBreaks,
  };
};
