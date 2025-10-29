import { apiInstance, doRequest } from '~/services/api-instance';
import { ListTagsResponse } from './interfaces';

export const listTagsWorkspace = async (
  workspaceId: string,
  params?: { page?: number; pageSize?: number; search?: string }
): Promise<ListTagsResponse> => {
  const response = await apiInstance.get('tags', {
    params: {
      workspaceId,
      page: params?.page,
      limit: params?.pageSize,
      search: params?.search,
    },
  });
  return doRequest(Promise.resolve(response));
};
