import { apiInstance, doRequest } from '~/services/api-instance';

export const getRatings = async (workspaceId: string, queryString: string) => {
  return doRequest(apiInstance.get(`/rating/workspaces/${workspaceId}/ratings?${queryString}`));
};
