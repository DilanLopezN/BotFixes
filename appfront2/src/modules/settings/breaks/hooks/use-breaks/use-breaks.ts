import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { BreakTime } from '~/interfaces/break-time';
import { getBreaks, type GetBreaksProps } from '~/services/workspace/get-breaks';
import { notifyError } from '~/utils/notify-error';

export const useBreaks = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [breaks, setBreaks] = useState<BreakTime[]>();
  const [isFetchingBreaks, setIsFetchingBreaks] = useState(true);
  const [fetchBreaksError, setFetchBreaksError] = useState<ApiError>();

  const fetchBreaks = useCallback(
    async (props: GetBreaksProps) => {
      try {
        setFetchBreaksError(undefined);
        setIsFetchingBreaks(true);
        const response = await getBreaks(workspaceId, props);
        setBreaks(response.data);
        setIsFetchingBreaks(false);
        return true;
      } catch (error) {
        notifyError('Erro ao carregar pausas');
        setFetchBreaksError(error as ApiError);
        setIsFetchingBreaks(false);
        return false;
      }
    },
    [workspaceId]
  );

  return {
    breaks,
    isFetchingBreaks,
    fetchBreaksError,
    fetchBreaks,
  };
};
