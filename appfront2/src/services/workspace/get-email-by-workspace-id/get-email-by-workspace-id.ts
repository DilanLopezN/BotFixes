import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { User } from '~/interfaces/user';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getEmailByWorkspaceId = async (
  workspaceId: string,
  email: string
): Promise<PaginatedModel<User>> =>
  doRequest(apiInstance.get(`workspaces/${workspaceId}/users?email=${email}`));
