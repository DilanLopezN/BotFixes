import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetAgentProductivityRankProps, GetAgentProductivityRankResponse } from './interfaces';

export const getAgentProductivityRank = async (
  workspaceId: string,
  payload: GetAgentProductivityRankProps
): Promise<GetAgentProductivityRankResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/analytics/agent-conversation-metrics/top`, payload)
  );
