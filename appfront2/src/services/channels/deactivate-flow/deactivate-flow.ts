import { apiInstance, doRequest } from '~/services/api-instance';

export const deactivateFlow = async (
  workspaceId: string,
  payload: { channelConfigId: string; flowId: number }
): Promise<any> => {
  return doRequest(
    apiInstance.post(`/channels/whatsapp/flow/workspaces/${workspaceId}/deactivate`, payload)
  );
};
