import { apiInstance, doRequest } from '~/services/api-instance';
import { FlowLibrariesResponse, GetFlowLibrariesParams } from './interfaces';

export const getFlowLibraries = async (
  workspaceId: string,
  filters?: GetFlowLibrariesParams
): Promise<FlowLibrariesResponse> =>
  doRequest(apiInstance.post(`/channels/whatsapp/flow-library/workspaces/${workspaceId}`, filters));
