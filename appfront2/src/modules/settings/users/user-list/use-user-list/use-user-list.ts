import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { User } from '~/interfaces/user';
import { getUsersByWorkspaceId } from '~/services/workspace/get-users-by-workspace-id';

export const useUserList = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const fetchUserList = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getUsersByWorkspaceId(workspaceId);
      const { data: userList } = response;
      setData(userList);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchUserList();
  }, [fetchUserList]);

  return { data, isLoading, error, fetchUserList };
};
