import type { User } from '~/interfaces/user';
import type { Workspace } from '~/interfaces/workspace';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateWorkspaceById = async (payload: Partial<Workspace>): Promise<User> =>
  doRequest(apiInstance.put(`workspaces/${payload._id}`, payload));
