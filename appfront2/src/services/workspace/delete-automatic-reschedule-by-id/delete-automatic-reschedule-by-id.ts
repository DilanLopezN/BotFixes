import { apiInstance, doRequest } from '~/services/api-instance';

export const deleteAutomaticRescheduleById = async (
  workspaceId: string,
  automaticRescheduleId: string
): Promise<any> =>
  doRequest(
    apiInstance.delete(`workspaces/${workspaceId}/smt-re-settings/${automaticRescheduleId}`)
  );
