import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetTotalBreakTimeResponse, GetTotalBreakTimeProps } from './interfaces';

export const getTotalBreakTime = async (
  workspaceId: string,
  payload: GetTotalBreakTimeProps
): Promise<GetTotalBreakTimeResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatusAnalytics/getTotalBreakTime`, payload)
  );
