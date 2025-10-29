import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '~/interfaces/api-error';
import { UpdateTrainingEntryDto } from '~/interfaces/training-entry';
import { updateTrainingEntry } from '~/services/workspace/update-training-entry';

export const useUpdateTrainingEntry = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError>();

  const updateEntry = useCallback(
    async (dto: UpdateTrainingEntryDto) => {
      try {
        setIsLoading(true);
        setError(undefined);
        await updateTrainingEntry(workspaceId, dto);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId]
  );

  return { updateEntry, isLoading, error };
};
