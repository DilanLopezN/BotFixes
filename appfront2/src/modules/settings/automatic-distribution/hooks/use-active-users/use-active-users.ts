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
  const [activeUsers, setActiveUsers] = useState<PaginatedModel<User>>();
  const [isLoadingActiveUsers, setIsLoadingActiveUsers] = useState(true);
  const [activeUsersError, setActiveUsersError] = useState<ApiError>();

  const queryString = createQueryString({
    sort: 'name',
  });

  const fetchActiveUsers = useCallback(async () => {
    try {
      setIsLoadingActiveUsers(true);
      setActiveUsersError(undefined);
      const response = await getActiveUsersByWorkspaceId(workspaceId, queryString);
      setActiveUsers(response);
      setIsLoadingActiveUsers(false);
      return true;
    } catch (err) {
      setActiveUsersError(err as ApiError);
      notifyError(err);
      setIsLoadingActiveUsers(false);
      return false;
    }
  }, [queryString, workspaceId]);

  return {
    activeUsers,
    isLoadingActiveUsers,
    activeUsersError,
    fetchActiveUsers,
  };
};
