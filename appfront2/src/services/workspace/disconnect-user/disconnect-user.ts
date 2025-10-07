import { Tag } from '~/interfaces/tag';
import { apiInstance, doRequest } from '~/services/api-instance';

export const disconnectUser = async (workspaceId: string): Promise<Tag> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/agentStatus/workingTimeDisconnect`));
