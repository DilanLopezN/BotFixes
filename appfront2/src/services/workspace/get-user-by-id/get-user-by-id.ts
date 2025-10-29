import type { User } from '~/interfaces/user';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetUserByIdProps } from './interfaces';

export const getUsersById = async ({ workspaceId, userId }: GetUserByIdProps): Promise<User> =>
  doRequest(apiInstance.get(`workspaces/${workspaceId}/users/${userId}`));
