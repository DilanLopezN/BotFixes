import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetBreakOvertimeProps, GetBreakOvertimeResponse } from './interfaces';

export const getBreakOvertime = async (
  workspaceId: string,
  payload: GetBreakOvertimeProps
): Promise<GetBreakOvertimeResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatusAnalytics/getBreakOvertime`, payload)
  );
