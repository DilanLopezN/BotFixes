import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetTagsByWorkspaceIdResponse } from './interfaces';

export const getTagsByWorkspaceId = async (
  workspaceId: string,
  queryString?: string
): Promise<GetTagsByWorkspaceIdResponse> => {
  return doRequest(apiInstance.get(`/workspaces/${workspaceId}/tags${queryString || ''}`));
};
