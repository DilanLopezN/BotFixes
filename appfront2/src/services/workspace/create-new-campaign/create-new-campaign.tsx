import type { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { CreateCampaignResponse, CreateNewCampaignProps } from './interfaces';

export const createNewCampaign = async (
  workspaceId: string,
  payload: CreateNewCampaignProps
): Promise<NewResponseModel<CreateCampaignResponse>> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/campaigns/create-campaign`, { data: payload })
  );
