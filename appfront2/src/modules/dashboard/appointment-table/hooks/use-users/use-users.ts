import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { User } from '~/interfaces/user';
import { getAllUsersByWorkspaceId } from '~/services/workspace/get-all-users-by-workspace-id';
import { createQueryString } from '~/utils/create-query-string';
import { notifyError } from '~/utils/notify-error';

export const useUsers = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [users, setUsers] = useState<PaginatedModel<User>>();
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [activeError, setUsersError] = useState<ApiError>();

  const queryString = createQueryString({
    sort: 'name',
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsFetchingUsers(true);
      setUsersError(undefined);
      const response = await getAllUsersByWorkspaceId(workspaceId, queryString);
      setUsers(response);
      setIsFetchingUsers(false);
      return true;
    } catch (err) {
      setUsersError(err as ApiError);
      notifyError(err);
      setIsFetchingUsers(false);
      return false;
    }
  }, [queryString, workspaceId]);

  return {
    users,
    isFetchingUsers,
    activeError,
    fetchUsers,
  };
};
