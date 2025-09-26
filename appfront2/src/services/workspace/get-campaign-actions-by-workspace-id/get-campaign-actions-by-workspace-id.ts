import { CampaignAction } from '~/interfaces/campaign-actions';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getCampaignActionsByWorkspaceId = async (
  workspaceId: string,
  queryString?: string
): Promise<CampaignAction[]> =>
  doRequest(apiInstance.get(`workspaces/${workspaceId}/campaign-actions${queryString || ''}`));
