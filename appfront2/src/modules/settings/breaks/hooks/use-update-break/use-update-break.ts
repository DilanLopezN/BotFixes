import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { BreakTime } from '~/interfaces/break-time';
import { updateBreakById } from '~/services/workspace/update-break-by-id';

export const useUpdateBreak = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ApiError>();

  const updateBreak = useCallback(
    async (breakTime: Partial<BreakTime>) => {
      if (isUpdating) return;

      try {
        setError(undefined);
        setIsUpdating(true);
        const newBreak = await updateBreakById(workspaceId, {
          ...breakTime,
          durationSeconds: (breakTime?.durationSeconds || 0) * 60,
        });
        setIsUpdating(false);
        return newBreak;
      } catch (err) {
        setError(err as ApiError);
        setIsUpdating(false);
        return false;
      }
    },
    [isUpdating, workspaceId]
  );

  return { isUpdating, error, updateBreak };
};
