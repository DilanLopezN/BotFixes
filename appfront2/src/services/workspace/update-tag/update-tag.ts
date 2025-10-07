import { Tag } from '~/interfaces/tag';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateTagWorkspace = (workspaceId: string, tag: Tag): Promise<Tag> => {
  const request = apiInstance.put(`/workspaces/${workspaceId}/tags/${tag._id}`, {
    name: tag.name,
    color: tag.color,
    inactive: tag.inactive,
    workspaceId: tag.workspaceId,
  });

  return doRequest<Tag>(request);
};
