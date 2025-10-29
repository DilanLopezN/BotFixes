import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { User } from '~/interfaces/user';
import { getActiveUsersByWorkspaceId } from '~/services/workspace/get-active-users-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';

export const useActiveUsers = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<PaginatedModel<User>>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError>();

  const queryString = createQueryString({
    sort: 'name',
  });

  const fetchActiveUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getActiveUsersByWorkspaceId(workspaceId, queryString);
      setData(response);
    } catch (err) {
      setError(err as ApiError);
      notifyError(err);
    } finally {
      setIsLoading(false);
    }
  }, [queryString, workspaceId]);

  return { data, isLoading, error, fetchActiveUsers };
};
