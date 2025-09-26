import type { User } from '~/interfaces/user';
import { apiInstance, doRequest } from '~/services/api-instance';
import { UpdateUserProps } from './interfaces';

export const updateUsersById = async (
  workspaceId: string,
  userId: string,
  userData: UpdateUserProps
): Promise<User> =>
  doRequest(apiInstance.put(`workspaces/${workspaceId}/users/${userId}`, { ...userData }));
