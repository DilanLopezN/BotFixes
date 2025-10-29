import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { UserActivityStatus } from '~/constants/user-activity-status';
import { useAuth } from '~/hooks/use-auth';
import { useInterval } from '~/hooks/use-interval';
import { useUserActivity } from '~/hooks/use-user-activity';
import { useWorkspaceList } from '~/hooks/use-workspace-list';
import { UserActivity } from '~/interfaces/user-activity';
import { isAnySystemAdmin, isWorkspaceAdmin } from '~/utils/permissions';
import { InAutomaticBreakModal } from './automatic-break-lock-modal';
import { BreakLockModal } from './break-lock-modal';
import { DisconnectedLockModal } from './disconnected-lock-modal';
import { IdleLockModal } from './idle-lock-modal';

export const ActivityMonitor = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { data: workspaceList } = useWorkspaceList();
  const { user } = useAuth();
  const { userActivity, fetchUserActivity } = useUserActivity();

  const selectedWorkspace = useMemo(() => {
    return workspaceList?.data?.find((workspace) => workspace._id === workspaceId);
  }, [workspaceId, workspaceList?.data]);

  const isUserAdmin = user
    ? isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace?._id || '')
    : false;

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
      const idleNotificationExpirationTime = dayjs(
        Number(uActivity.contextLastAcess.lastAcess)
      ).add(uActivity.contextLastAcess.generalBreakSetting.notificationIntervalSeconds, 'seconds');
      const isExpired = dayjs().isAfter(idleNotificationExpirationTime);

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
