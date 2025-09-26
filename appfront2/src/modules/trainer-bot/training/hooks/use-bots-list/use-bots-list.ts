import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { Bot } from '~/interfaces/bot';
import { getWorkspaceBots } from '~/services/workspace/get-workspace-bots';

export const useBotsList = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const fetchBotsList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await getWorkspaceBots(workspaceId);
      const { data: userList } = response;
      setData(userList);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchBotsList();
  }, [fetchBotsList]);

  return { data, isLoading, error, fetchBotsList };
};
