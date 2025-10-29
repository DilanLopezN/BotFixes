import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { startBreakById } from '~/services/workspace/start-break-by-id';
import { notifyError } from '~/utils/notify-error';

export const useStartBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isStartingBreak, setIsStartingBreak] = useState(false);
  const [startBreakError, setStartBreakError] = useState<ApiError>();

  const startBreak = useCallback(
    async (breakSettingId: number) => {
      try {
        setStartBreakError(undefined);
        setIsStartingBreak(true);
        await startBreakById(workspaceId, { breakSettingId });
        setIsStartingBreak(false);
        return true;
      } catch (error) {
        notifyError('Erro ao iniciar pausa');
        setStartBreakError(error as ApiError);
        setIsStartingBreak(false);
        return false;
      }
    },
    [workspaceId]
  );

  return {
    isStartingBreak,
    startBreakError,
    startBreak,
  };
};
