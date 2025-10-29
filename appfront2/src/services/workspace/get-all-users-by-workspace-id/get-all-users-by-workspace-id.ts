import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { User } from '~/interfaces/user';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getAllUsersByWorkspaceId = async (
  workspaceId: string,
  queryString?: string
): Promise<PaginatedModel<User>> =>
  doRequest(apiInstance.get(`workspaces/${workspaceId}/users${queryString || ''}`));
