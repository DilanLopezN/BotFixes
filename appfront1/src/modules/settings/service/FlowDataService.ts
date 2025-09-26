import { doRequest, apiInstance } from '../../../utils/Http';

export const FlowDataService = {
    getFlowDataByWorkspaceIdAndFlow: async (workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/channels/whatsapp/flow-data/workspaces/${workspaceId}/list`));
    },
    getFlowDataByIdAndFlow: async (workspaceId: string, flowDataId: number): Promise<any> => {
        return await doRequest(
            apiInstance.get(`/channels/whatsapp/flow-data/workspaces/${workspaceId}/find-one/${flowDataId}`)
        );
    },
};
