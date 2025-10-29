import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { User } from '~/interfaces/user';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getActiveUsersByWorkspaceId = async (
  workspaceId: string,
  queryString?: string
): Promise<PaginatedModel<User>> =>
  doRequest(apiInstance.get(`workspaces/${workspaceId}/users-active${queryString || ''}`));
