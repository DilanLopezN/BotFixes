import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '~/interfaces/api-error';
import { CreateTrainingEntryDto } from '~/interfaces/training-entry';
import { createTrainingEntry } from '~/services/workspace/create-training-entry';

export const useCreateTrainingEntry = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError>();

  const createEntry = useCallback(
    async (dto: CreateTrainingEntryDto) => {
      try {
        setIsLoading(true);
        setError(undefined);
        await createTrainingEntry(workspaceId, dto);
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

  return { createEntry, isLoading, error };
};
