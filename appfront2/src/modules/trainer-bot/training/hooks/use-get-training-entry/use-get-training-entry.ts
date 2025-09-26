import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { TrainingEntry } from '~/interfaces/training-entry';
import { getTrainingEntry } from '~/services/workspace/get-training-entry';

export const useGetTrainingEntry = (trainingEntryId: string) => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<TrainingEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const fetchTrainingEntry = useCallback(async () => {
    try {
      if (!trainingEntryId) return;
      setIsLoading(true);
      setError(undefined);
      const response = await getTrainingEntry(workspaceId, { trainingEntryId });
      setData(response.data || null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, trainingEntryId]);

  useEffect(() => {
    fetchTrainingEntry();
  }, [fetchTrainingEntry]);

  return { data, isLoading, error, fetchTrainingEntry };
};
