import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '~/interfaces/api-error';
import { DeleteTrainingEntryDto } from '~/interfaces/training-entry';
import { deleteTrainingEntry } from '~/services/workspace/delete-training-entry';

export const useDeleteTrainingEntry = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError>();

  const deleteEntry = useCallback(
    async (dto: DeleteTrainingEntryDto) => {
      try {
        setIsLoading(true);
        setError(undefined);
        await deleteTrainingEntry(workspaceId, dto);
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

  return { deleteEntry, isLoading, error };
};
