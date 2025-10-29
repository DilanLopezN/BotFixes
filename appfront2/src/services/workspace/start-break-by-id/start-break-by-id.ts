import { Tag } from '~/interfaces/tag';
import { apiInstance, doRequest } from '~/services/api-instance';
import { StartBreakByIdProps } from './interfaces';

export const startBreakById = async (
  workspaceId: string,
  payload: StartBreakByIdProps
): Promise<Tag> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatus/workingTimeStartBreak`, payload)
  );
