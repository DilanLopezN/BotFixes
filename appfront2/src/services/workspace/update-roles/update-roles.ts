import type { User } from '~/interfaces/user';
import { UserPermission } from '~/interfaces/user-permission';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateRoles = async (
  workspaceId: string,
  userId: string,
  newRoles: UserPermission
): Promise<User> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/users/${userId}/roles`, {
      ...newRoles,
    })
  );
