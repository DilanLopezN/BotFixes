import { apiInstance, doRequest } from '~/services/api-instance';
import { FlowLibraryResponseById } from './interfaces';

export const getFlowLibraryById = async (
  workspaceId: string,
  flowLibraryId: string
): Promise<FlowLibraryResponseById> =>
  doRequest(
    apiInstance.get(`/channels/whatsapp/flow-library/workspaces/${workspaceId}/id/${flowLibraryId}`)
  );
