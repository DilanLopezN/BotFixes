import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { BreakTime } from '~/interfaces/break-time';
import { createBreak } from '~/services/workspace/create-break';

export const useCreateBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const createNewBreak = useCallback(
    async (breakTime: Partial<BreakTime>) => {
      if (isCreating) return;

      try {
        setError(undefined);
        setIsCreating(true);
        const newBreak = await createBreak(workspaceId, {
          ...breakTime,
          durationSeconds: (breakTime?.durationSeconds || 0) * 60,
          enabled: true,
        });
        setIsCreating(false);
        return newBreak;
      } catch (err) {
        setError(err as ApiError);
        setIsCreating(false);
        return false;
      }
    },
    [isCreating, workspaceId]
  );

  return { isCreating, error, createNewBreak };
};
