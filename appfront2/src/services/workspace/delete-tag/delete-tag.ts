import { apiInstance, doRequest } from '~/services/api-instance';

export const deleteTagWorkspace = (workspaceId: string, tagId: string): Promise<void> => {
  const request = apiInstance.delete(`/workspaces/${workspaceId}/tags/${tagId}`);

  return doRequest(request);
};
