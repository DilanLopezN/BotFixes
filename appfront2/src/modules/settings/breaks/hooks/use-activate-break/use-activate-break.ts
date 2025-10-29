import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { BreakTime } from '~/interfaces/break-time';
import { activateBreakById } from '~/services/workspace/activate-break-by-id';

export const useActivateBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const activateBreak = useCallback(
    async (breakTime: Partial<BreakTime>) => {
      if (isActivating) return;

      try {
        setError(undefined);
        setIsActivating(true);
        const result = await activateBreakById(workspaceId, breakTime);
        setIsActivating(false);
        return result;
      } catch (err) {
        setError(err as ApiError);
        setIsActivating(false);
        return false;
      }
    },
    [isActivating, workspaceId]
  );

  return { isActivating, error, activateBreak };
};
