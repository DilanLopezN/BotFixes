import { apiInstance, doRequest } from '~/services/api-instance';

export const deleteDistributionRule = async (workspaceId: string, id: string): Promise<void> =>
  doRequest(
    apiInstance.delete(
      `/conversation-automatic-distribution/${workspaceId}/distribution-rule/${id}`
    )
  );
