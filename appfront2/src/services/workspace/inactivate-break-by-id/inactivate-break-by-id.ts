import type { BreakTime } from '~/interfaces/break-time';
import { apiInstance, doRequest } from '~/services/api-instance';

export const inactivateBreakById = async (
  workspaceId: string,
  payload: Partial<BreakTime>
): Promise<BreakTime> => {
  const { id } = payload;

  return doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatus/breakSetting/${id}/disableBreakSetting`)
  );
};
