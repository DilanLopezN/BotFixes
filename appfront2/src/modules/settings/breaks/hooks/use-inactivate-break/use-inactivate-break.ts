import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { BreakTime } from '~/interfaces/break-time';
import { inactivateBreakById } from '~/services/workspace/inactivate-break-by-id';

export const useInactivateBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isInactivating, setIsInactivating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const inactivateBreak = useCallback(
    async (breakTime: Partial<BreakTime>) => {
      if (isInactivating) return;

      try {
        setError(undefined);
        setIsInactivating(true);
        const result = await inactivateBreakById(workspaceId, breakTime);
        setIsInactivating(false);
        return result;
      } catch (err) {
        setError(err as ApiError);
        setIsInactivating(false);
        return false;
      }
    },
    [isInactivating, workspaceId]
  );

  return { isInactivating, error, inactivateBreak };
};
