import type { BreakTime } from '~/interfaces/break-time';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateBreakById = async (
  workspaceId: string,
  payload: Partial<BreakTime>
): Promise<BreakTime> => {
  const { id, ...restPayload } = payload;

  return doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/agentStatus/breakSetting/${id}/updateBreakSetting`,
      restPayload
    )
  );
};
