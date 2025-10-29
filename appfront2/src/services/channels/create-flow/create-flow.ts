import { apiInstance, doRequest } from '~/services/api-instance';
import { CreateFlowPayload, CreateFlowResponse } from './interfaces';

export const createFlow = async (
  workspaceId: string,
  payload: CreateFlowPayload
): Promise<CreateFlowResponse> =>
  doRequest(
    apiInstance.post(`/channels/whatsapp/flow/workspaces/${workspaceId}/create-flow`, payload)
  );
