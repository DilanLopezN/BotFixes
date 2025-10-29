import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetTotalOnlineTimeResponse, GetTotalOnlineTimeProps } from './interfaces';

export const getTotalOnlineTime = async (
  workspaceId: string,
  payload: GetTotalOnlineTimeProps
): Promise<GetTotalOnlineTimeResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatusAnalytics/getTotalOnlineTime`, payload)
  );
