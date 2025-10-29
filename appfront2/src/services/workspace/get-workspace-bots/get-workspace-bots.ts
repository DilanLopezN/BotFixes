import { Bot } from '~/interfaces/bot';
import { PaginatedModel } from '~/interfaces/paginated-model';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getWorkspaceBots = (workspaceId: string): Promise<PaginatedModel<Bot>> => {
  return doRequest(apiInstance.get(`/workspaces/${workspaceId}/bots`));
};
