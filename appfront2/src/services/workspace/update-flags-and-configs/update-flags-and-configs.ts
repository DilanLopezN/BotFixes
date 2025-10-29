import type { User } from '~/interfaces/user';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateFlagsAndConfigs = async (
  workspaceId: string,
  payload: { featureFlag?: Record<string, any>; generalConfigs?: Record<string, any> }
): Promise<User> =>
  doRequest(apiInstance.patch(`/workspaces/${workspaceId}/customization`, payload));
