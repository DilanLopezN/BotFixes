import type { Campaign } from '~/interfaces/campaign';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetCampaignListByWorkspaceIdProps } from './interfaces';

export const getCampaignListByWorkspaceId = async (
  workspaceId: string,
  body: GetCampaignListByWorkspaceIdProps
): Promise<NewResponseModel<Partial<Campaign[]>>> => {
  return doRequest(apiInstance.post(`/workspaces/${workspaceId}/campaigns/list-campaigns`, body));
};
