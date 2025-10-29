import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../interfaces/api-error';
import { UserActivity } from '../../interfaces/user-activity';
import { apiInstance } from '../../utils/Http';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../utils/UserPermission';
import { notifyError } from '../../utils/notify-error';
import type { UserActivityContextValues, UserActivityProviderProps } from './interfaces';

export const UserActivityContext = createContext<UserActivityContextValues>({
    userActivity: undefined,
    isLoadingUserActivity: true,
    userActivityError: undefined,
    fetchUserActivity: () => {},
    setOffline: () => {},
});

export const UserActivityProvider = ({ children }: UserActivityProviderProps) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const user = useSelector((state: any) => state.loginReducer.loggedUser);
    const [userActivity, setUserActivity] = useState<UserActivity | { offline: boolean }>();
    const [isLoadingUserActivity, setIsLoadingUserActivity] = useState(true);
    const [userActivityError, setUserActivityError] = useState<ApiError>();

    const isUserAdmin = user ? isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace?._id || '') : false;

    const fetchUserActivity = useCallback(async () => {
        try {
            setIsLoadingUserActivity(true);
            const response = (
                await apiInstance.post(`workspaces/${selectedWorkspace?._id}/agentStatus/workingTimeGetUserStatus`)
            ).data;
            setUserActivity(response.data);
            setIsLoadingUserActivity(false);
            return true;
        } catch (err) {
            setUserActivityError(err as ApiError);
            setIsLoadingUserActivity(false);
            notifyError('Erro ao verificar atividade do usuário');
            return false;
        }
    }, [selectedWorkspace?._id]);

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

    return <UserActivityContext.Provider value={contextValues}>{children}</UserActivityContext.Provider>;
};
