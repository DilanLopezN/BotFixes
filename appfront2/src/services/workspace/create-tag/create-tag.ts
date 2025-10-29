import { Tag } from '~/interfaces/tag';
import { apiInstance, doRequest } from '~/services/api-instance';
import { CreateTagService } from './interfaces';

export const createTagWorkspace = async (
  workspaceId: string,
  payload: CreateTagService
): Promise<Tag> =>
  doRequest(apiInstance.post(`workspaces/${workspaceId}/tags`, { ...payload, workspaceId }));
