import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '~/hooks/use-auth';
import { useWorkspaceList } from '~/hooks/use-workspace-list';
import type { ApiError } from '~/interfaces/api-error';
import type { UserActivity } from '~/interfaces/user-activity';
import { getUserActivity } from '~/services/workspace/get-user-activity/get-user-activity';
import { notifyError } from '~/utils/notify-error';
import { isAnySystemAdmin, isWorkspaceAdmin } from '~/utils/permissions';
import type { UserActivityContextValues, UserActivityProviderProps } from './interfaces';

export const UserActivityContext = createContext<UserActivityContextValues>({
  userActivity: undefined,
  isLoadingUserActivity: true,
  userActivityError: undefined,
  fetchUserActivity: () => {},
  setOffline: () => {},
});

export const UserActivityProvider = ({ children }: UserActivityProviderProps) => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data: workspaceList } = useWorkspaceList();
  const { user } = useAuth();
  const [userActivity, setUserActivity] = useState<UserActivity | { offline: boolean }>();
  const [isLoadingUserActivity, setIsLoadingUserActivity] = useState(true);
  const [userActivityError, setUserActivityError] = useState<ApiError>();

  const selectedWorkspace = useMemo(() => {
    return workspaceList?.data?.find((workspace) => workspace._id === workspaceId);
  }, [workspaceId, workspaceList?.data]);

  const isUserAdmin = user
    ? isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace?._id || '')
    : false;

  const fetchUserActivity = useCallback(async () => {
    try {
      setIsLoadingUserActivity(true);
      const response = await getUserActivity(workspaceId);
      setUserActivity(response.data);
      setIsLoadingUserActivity(false);
      return true;
    } catch (err) {
      setUserActivityError(err as ApiError);
      setIsLoadingUserActivity(false);
      notifyError('Erro ao verificar atividade do usuário');
      return false;
    }
  }, [workspaceId]);

  const setOffline = useCallback(() => {
    setUserActivity({ offline: true });
    setIsLoadingUserActivity(false);
  }, []);

  const contextValues = useMemo(
    () => ({
      userActivity,
      isLoadingUserActivity,
      userActivityError,
      fetchUserActivity,
      setOffline,
    }),
    [userActivity, isLoadingUserActivity, userActivityError, fetchUserActivity, setOffline]
  );

  useEffect(() => {
    if (!selectedWorkspace || isUserAdmin) return;

    if (
      !selectedWorkspace?.advancedModuleFeatures?.enableAgentStatus ||
      !selectedWorkspace?.generalConfigs?.enableAgentStatusForAgents
    )
      return;

    fetchUserActivity();
  }, [fetchUserActivity, isUserAdmin, selectedWorkspace]);

  return (
    <UserActivityContext.Provider value={contextValues}>{children}</UserActivityContext.Provider>
  );
};
