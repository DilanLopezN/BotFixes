import { apiInstance, doRequest } from '~/services/api-instance';

export const activateFlow = async (
  workspaceId: string,
  payload: { channelConfigId: string; flowId: number }
): Promise<any> => {
  return doRequest(
    apiInstance.post(`/channels/whatsapp/flow/workspaces/${workspaceId}/activate`, payload)
  );
};
