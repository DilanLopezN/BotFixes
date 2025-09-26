import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '~/interfaces/api-error';
import { TrainingEntry } from '~/interfaces/training-entry';
import { listTrainingEntries } from '~/services/workspace/list-training-entries';

export const useTrainingEntries = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [trainings, setTrainings] = useState<TrainingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const fetchTrainingEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await listTrainingEntries(workspaceId);
      setTrainings(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTrainingEntries();
  }, [fetchTrainingEntries]);

  return { trainings, isLoading, error, fetchTrainingEntries };
};
