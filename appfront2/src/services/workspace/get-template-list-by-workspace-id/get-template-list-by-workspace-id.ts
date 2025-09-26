import type { PaginatedModel } from '~/interfaces/paginated-model';
import type { TemplateMessage } from '~/interfaces/template-message';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getTemplateListByWorkspaceId = async (
  workspaceId: string,
  queryString?: string
): Promise<PaginatedModel<TemplateMessage>> => {
  return doRequest(
    apiInstance.get(`/workspaces/${workspaceId}/template-message${queryString || ''}`)
  );
};
