import { doRequest, apiInstance } from '../../../utils/Http';
import { CampaignAction } from '../interfaces/campaign';

export const CampaignsActionService = {
    getActionMessagesFlow: async (workspaceId: string): Promise<CampaignAction[]> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/campaign-actions`));
    },

    updateCustomFlow: async (
        workspaceId: string,
        statusId: string,
        actionName: {
            name: string;
        },
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/campaign-actions/${statusId}`, actionName),
            undefined,
            errCb
        );
    },

    deleteCustomFlow: async (workspaceId: string, id: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/campaign-actions/${id}`),false, errCb);
    },
};
