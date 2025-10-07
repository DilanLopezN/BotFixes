import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { finishBreak, type FinishBreakProps } from '~/services/workspace/finish-break';
import { notifyError } from '~/utils/notify-error';

export const useFinishBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isFinishingBreak, setIsFinishingBreak] = useState(false);
  const [finishBreakError, setFinishBreakError] = useState<ApiError>();

  const finishUserBreak = useCallback(
    async (values: FinishBreakProps) => {
      try {
        setFinishBreakError(undefined);
        setIsFinishingBreak(true);
        await finishBreak(workspaceId, values);
        setIsFinishingBreak(false);
        return true;
      } catch (error) {
        notifyError('Erro ao finalizar pausa');
        setFinishBreakError(error as ApiError);
        setIsFinishingBreak(false);
        return false;
      }
    },
    [workspaceId]
  );

  return {
    isFinishingBreak,
    finishBreakError,
    finishUserBreak,
  };
};
