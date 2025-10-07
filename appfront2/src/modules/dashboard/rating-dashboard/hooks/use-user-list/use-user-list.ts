import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import type { User } from '~/interfaces/user';
import { getUsersByWorkspaceId } from '~/services/workspace/get-users-by-workspace-id';

export const useUserList = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoadingUserList, setIsLoadingUserList] = useState(true);
  const [userListerror, setUserListError] = useState<ApiError>();

  const fetchUserList = useCallback(async () => {
    try {
      setUserListError(undefined);
      setIsLoadingUserList(true);
      const response = await getUsersByWorkspaceId(workspaceId);
      setUserList(response.data);
      setIsLoadingUserList(false);
      return true;
    } catch (err) {
      setUserListError(err as ApiError);
      setIsLoadingUserList(false);
      return false;
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchUserList();
  }, [fetchUserList]);

  return { userList, isLoadingUserList, userListerror, fetchUserList };
};
