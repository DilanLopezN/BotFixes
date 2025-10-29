import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import { useAuth } from '~/hooks/use-auth';
import type { ApiError } from '~/interfaces/api-error';
import {
  getAgentProductivityRank,
  type GetAgentProductivityRankResponse,
} from '~/services/workspace/get-agent-productivity-rank';
import { notifyError } from '~/utils/notify-error';
import { useFilters } from '../use-filters';
import { useRefreshContext } from '../use-refresh-context';

export const useAgentRank = () => {
  const { user } = useAuth();
  const { startLoading, endLoading } = useRefreshContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const filters = useFilters();
  const [agentRank, setAgentRank] = useState<GetAgentProductivityRankResponse>();
  const [isFetchingAgentRank, setIsFetchingAgentRank] = useState(true);
  const [agentRankError, setAgentRankError] = useState<ApiError>();

  const fetchAgentRank = useCallback(async () => {
    try {
      startLoading();
      setAgentRankError(undefined);
      setIsFetchingAgentRank(true);
      const response = await getAgentProductivityRank(workspaceId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        teamId: filters.teamId,
        breakSettingId: filters.breakSettingId,
        interval: AnalyticsInterval.Year,
        // userId: filters.userId,
        timezone: user?.timezone,
      });
      setAgentRank(response);
      setIsFetchingAgentRank(false);
      endLoading();
      return true;
    } catch (error) {
      notifyError('Erro ao carregar rank de agentes');
      setAgentRankError(error as ApiError);
      setIsFetchingAgentRank(false);
      endLoading();
      return false;
    }
  }, [
    endLoading,
    filters.endDate,
    filters.breakSettingId,
    filters.startDate,
    filters.teamId,
    startLoading,
    user?.timezone,
    workspaceId,
  ]);

  return {
    agentRank,
    isFetchingAgentRank,
    agentRankError,
    fetchAgentRank,
  };
};
