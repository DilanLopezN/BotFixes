import type { ActiveMessageSetting } from '~/interfaces/active-message-setting';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getActiveMessageListByWorkspaceId = async (
  workspaceId: string,
  queryString?: string
): Promise<ActiveMessageSetting[]> => {
  return doRequest(
    apiInstance.get(`/workspaces/${workspaceId}/active-message-settings${queryString || ''}`)
  );
};
