import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import {
  changeAgentStatus,
  type ChangeAgentStatusProps,
} from '~/services/workspace/change-agent-status';

export const useChangeAgentStatus = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isChangingAgentStatus, setIsChangingAgentStatus] = useState(false);
  const [changeAgentStatusError, setChangeAgentStatusError] = useState<ApiError>();

  const changeMultipleAgentStatus = useCallback(
    async (props: ChangeAgentStatusProps) => {
      if (isChangingAgentStatus) return;

      try {
        const normalizedProps: ChangeAgentStatusProps = {
          userIds: props.userIds,
          changeToOffline: props.breakSettingId === -1 ? true : undefined,
          breakSettingId: props.breakSettingId !== -1 ? props.breakSettingId : undefined,
        };

        setChangeAgentStatusError(undefined);
        setIsChangingAgentStatus(true);
        const newBreak = await changeAgentStatus(workspaceId, normalizedProps);
        setIsChangingAgentStatus(false);
        return newBreak;
      } catch (err) {
        setChangeAgentStatusError(err as ApiError);
        setIsChangingAgentStatus(false);
        return false;
      }
    },
    [isChangingAgentStatus, workspaceId]
  );

  return {
    isChangingAgentStatus,
    changeAgentStatusError,
    changeMultipleAgentStatus,
  };
};
