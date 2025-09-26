import moment from 'moment';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { UserActivityStatus } from '../../constants/user-activity-status';
import { useInterval } from '../../hooks/use-interval';
import { useUserActivity } from '../../hooks/use-user-activity';
import { UserActivity } from '../../interfaces/user-activity';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../utils/UserPermission';
import { InAutomaticBreakModal } from './automatic-break-lock-modal';
import { BreakLockModal } from './break-lock-modal';
import { DisconnectedLockModal } from './disconnected-lock-modal';
import { IdleLockModal } from './idle-lock-modal';

export const ActivityMonitor = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const user = useSelector((state: any) => state.loginReducer.loggedUser);
    const { userActivity, fetchUserActivity } = useUserActivity();

    const isUserAdmin = user ? isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace?._id || '') : false;

    const isAutomaticBreakEnabled = useMemo(() => {
        const uActivity = userActivity as UserActivity;

        if (isUserAdmin) {
            return false;
        }

        return (
            selectedWorkspace?.advancedModuleFeatures?.enableAgentStatus &&
            selectedWorkspace?.generalConfigs?.enableAgentStatusForAgents &&
            uActivity?.contextLastAcess?.generalBreakSetting.enabled
        );
    }, [
        isUserAdmin,
        selectedWorkspace?.advancedModuleFeatures?.enableAgentStatus,
        selectedWorkspace?.generalConfigs?.enableAgentStatusForAgents,
        userActivity,
    ]);

    useInterval(
        () => {
            if (isAutomaticBreakEnabled) {
                fetchUserActivity();
            }
        },
        isAutomaticBreakEnabled ? 60_000 : 0
    );

    const getUserStatus = () => {
        if (!userActivity) {
            return UserActivityStatus.UNDEFINED;
        }

        if ((userActivity as { offline: boolean })?.offline) {
            return UserActivityStatus.OFFLINE;
        }

        const uActivity = userActivity as UserActivity;

        if (uActivity.type === UserActivityStatus.BREAK) {
            return UserActivityStatus.BREAK;
        }

        if (uActivity.type === UserActivityStatus.INACTIVE) {
            return UserActivityStatus.INACTIVE;
        }

        if (
            uActivity.type === UserActivityStatus.ONLINE &&
            uActivity.contextLastAcess &&
            uActivity.contextLastAcess.generalBreakSetting.enabled &&
            uActivity.contextLastAcess.lastAcess
        ) {
            const idleNotificationExpirationTime = moment(Number(uActivity.contextLastAcess.lastAcess)).add(
                uActivity.contextLastAcess.generalBreakSetting.notificationIntervalSeconds,
                'seconds'
            );
            const isExpired = moment().isAfter(idleNotificationExpirationTime);

            return isExpired ? UserActivityStatus.IDLE : UserActivityStatus.ONLINE;
        }

        return UserActivityStatus.ONLINE;
    };

    if (
        !selectedWorkspace ||
        isUserAdmin ||
        !selectedWorkspace?.advancedModuleFeatures?.enableAgentStatus ||
        !selectedWorkspace?.generalConfigs?.enableAgentStatusForAgents
    ) {
        return null;
    }

    const userStatus = getUserStatus();

    return (
        <>
            <DisconnectedLockModal isModalOpen={userStatus === UserActivityStatus.OFFLINE} />
            <BreakLockModal isModalOpen={userStatus === UserActivityStatus.BREAK} />;
            <IdleLockModal isModalOpen={userStatus === UserActivityStatus.IDLE} />
            <InAutomaticBreakModal isModalOpen={userStatus === UserActivityStatus.INACTIVE} />
        </>
    );
};
