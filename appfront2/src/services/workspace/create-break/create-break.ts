import type { BreakTime } from '~/interfaces/break-time';
import { apiInstance, doRequest } from '~/services/api-instance';

export const createBreak = async (
  workspaceId: string,
  payload: Partial<BreakTime>
): Promise<BreakTime> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/agentStatus/createBreakSetting`, payload));
