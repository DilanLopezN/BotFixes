import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetTotalBreakOvertimeResponse, GetTotalBreakOvertimeProps } from './interfaces';

export const getTotalBreakOvertime = async (
  workspaceId: string,
  payload: GetTotalBreakOvertimeProps
): Promise<GetTotalBreakOvertimeResponse> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/agentStatusAnalytics/getTotalBreakOvertime`,
      payload
    )
  );
