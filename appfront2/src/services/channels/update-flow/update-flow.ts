import { apiInstance, doRequest } from '~/services/api-instance';
import { UpdateFlowResponse } from './interfaces';

export const updateFlow = async (
  workspaceId: string,
  flowId: number,
  payload: any
): Promise<UpdateFlowResponse> =>
  doRequest(
    apiInstance.post(
      `/channels/whatsapp/flow/workspaces/${workspaceId}/update-flow-data/${flowId}`,
      payload
    )
  );
