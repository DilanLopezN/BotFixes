import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetOnlineTimeProps, GetOnlineTimeResponse } from './interfaces';

export const getOnlineTime = async (
  workspaceId: string,
  payload: GetOnlineTimeProps
): Promise<GetOnlineTimeResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatusAnalytics/getOnlineTime`, payload)
  );
