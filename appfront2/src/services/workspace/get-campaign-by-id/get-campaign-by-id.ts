import { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetCampaignResponse } from './interfaces';

export const getCampaignById = async (
  workspaceId: string,
  campaignId: number
): Promise<NewResponseModel<GetCampaignResponse>> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/campaigns/get-campaign`, {
      data: {
        campaignId,
      },
    })
  );
