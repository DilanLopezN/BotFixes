import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '~/interfaces/api-error';
import { DoTrainingDto } from '~/interfaces/training-entry';
import { doTraining } from '~/services/workspace/do-training';

export const useDoTraining = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError>();

  const startTraining = useCallback(
    async (dto: DoTrainingDto) => {
      try {
        setIsLoading(true);
        setError(undefined);
        await doTraining(workspaceId, dto);
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

  return { startTraining, isLoading, error };
};
