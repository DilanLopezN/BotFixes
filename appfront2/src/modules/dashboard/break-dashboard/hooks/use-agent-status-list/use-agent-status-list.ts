import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { getAgentStatus, type GetAgentStatusResponse } from '~/services/workspace/get-agent-status';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useAgentStatusList = () => {
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [agentStatusList, setUseAgentStatusList] = useState<GetAgentStatusResponse>();
  const [isFetchingAgentStatusList, setIsFetchingAgentStatusList] = useState(true);
  const [agentStatusListError, setAgentStatusListError] = useState<ApiError>();

  const fetchAgentStatusList = useCallback(async () => {
    try {
      startLoading();
      setAgentStatusListError(undefined);
      setIsFetchingAgentStatusList(true);
      const response = await getAgentStatus(workspaceId, {
        teamId: filters.teamId,
        userId: filters.userId,
        breakSettingId: filters.breakSettingId,
      });
      setUseAgentStatusList(response);
      setIsFetchingAgentStatusList(false);
      endLoading();
      return true;
    } catch (err) {
      setAgentStatusListError(err as ApiError);
      setIsFetchingAgentStatusList(false);
      notifyError('Erro ao carregar status dos agentes');
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.breakSettingId,
    filters.teamId,
    filters.userId,
    startLoading,
    workspaceId,
  ]);

  return {
    agentStatusList,
    isFetchingAgentStatusList,
    agentStatusListError,
    fetchAgentStatusList,
  };
};
