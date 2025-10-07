import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetAgentStatusProps, GetAgentStatusResponse } from './interfaces';

export const getAgentStatus = async (
  workspaceId: string,
  payload: GetAgentStatusProps
): Promise<GetAgentStatusResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatusAnalytics/getAgentStatus`, payload)
  );
