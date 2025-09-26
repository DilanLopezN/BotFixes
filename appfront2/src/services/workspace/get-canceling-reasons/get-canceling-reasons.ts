import type { CancelingReason } from '~/interfaces/canceling-reason';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getCancelingReasons = (workspaceId: string): Promise<CancelingReason[]> => {
  return doRequest(apiInstance.get(`/cancel-reason/workspaces/${workspaceId}/list`));
};
