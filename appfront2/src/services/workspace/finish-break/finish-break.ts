import { Tag } from '~/interfaces/tag';
import { apiInstance, doRequest } from '~/services/api-instance';
import { FinishBreakProps } from './interfaces';

export const finishBreak = async (workspaceId: string, payload: FinishBreakProps): Promise<Tag> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatus/workingTimeEndBreakAndConnect`, payload)
  );
