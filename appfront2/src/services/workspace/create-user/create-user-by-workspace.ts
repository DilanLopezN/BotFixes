import { apiInstance, doRequest } from '~/services/api-instance';
import { CreateUsersProps } from './interfaces';

export const createUsersByWorkspace = async (
  workspaceId: string,
  user: CreateUsersProps
): Promise<any> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/users`, {
      ...user,
    })
  );
