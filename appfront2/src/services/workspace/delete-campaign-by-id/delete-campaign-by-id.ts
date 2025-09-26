import { apiInstance, doRequest } from '~/services/api-instance';

export const deleteCampaignById = async (workspaceId: string, campaignId: number): Promise<any> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/campaigns/do-delete-campaign`, {
      data: {
        campaignId,
      },
    })
  );
