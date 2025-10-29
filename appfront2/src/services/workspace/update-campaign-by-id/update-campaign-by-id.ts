import type { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { UpdateCampaignByIdCampaignResponse, UpdateCampaignByIdProps } from './interfaces';

export const updateCampaignById = async (
  workspaceId: string,
  payload: UpdateCampaignByIdProps
): Promise<NewResponseModel<UpdateCampaignByIdCampaignResponse>> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/campaigns/update-campaign`, { data: payload })
  );
