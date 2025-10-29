import type { PaginatedModel } from '~/interfaces/paginated-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { Workspace } from '../../../interfaces/workspace';

export const getWorkspaces = async (queryString?: string): Promise<PaginatedModel<Workspace>> =>
  doRequest(apiInstance.get(`workspaces${queryString || ''}`));
