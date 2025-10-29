import type { NewResponseModel } from '~/interfaces/new-response-model';
import type { UserActivity } from '~/interfaces/user-activity';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getUserActivity = async (
  workspaceId: string
): Promise<NewResponseModel<UserActivity> | NewResponseModel<{ offline: boolean }>> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/agentStatus/workingTimeGetUserStatus`));
