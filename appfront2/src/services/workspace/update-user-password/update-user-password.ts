import type { User } from '~/interfaces/user';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { ChangeUserPasswordProps } from './interfaces';

export const updateUsersPassword = async (
  workspaceId: string,
  userId: string,
  userPassword: ChangeUserPasswordProps
): Promise<User> =>
  doRequest(apiInstance.put(`workspaces/${workspaceId}/users/${userId}/password`, userPassword));
