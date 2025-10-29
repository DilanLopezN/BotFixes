import { doRequest, apiInstance } from '../../../utils/Http';
import { CreatePrivacyPolicy, PrivacyPolicyInterface, UpdatePrivacyPolicy } from '../interfaces/privacy-policy';

export const PrivacyPolicyService = {
    createPrivacyPolicy: async (workspaceId: string, data: CreatePrivacyPolicy, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/workspaces/${workspaceId}/privacy-policy`, data), undefined, errCb);
    },
    getPrivacyPolicy: async (workspaceId: string, privacyPolicyId: number): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/privacy-policy/${privacyPolicyId}`), true);
    },
    getPrivacyPolicyList: async (workspaceId: string, errCb?): Promise<PrivacyPolicyInterface[]> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/privacy-policy-list`), undefined, errCb);
    },
    updatePrivacyPolicy: async (workspaceId: string, data: UpdatePrivacyPolicy, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/privacy-policy/${data.id}`, {
                ...data,
                workspaceId: workspaceId,
            }),
            undefined,
            errCb
        );
    },
    deletePrivacyPolicy: async (workspaceId: string, privacyPolicyId: number, errCb?): Promise<any> => {
        return await doRequest(
            apiInstance.delete(`/workspaces/${workspaceId}/privacy-policy/${privacyPolicyId}`),
            errCb
        );
    },
    restartPrivacyPolicyAcceptance: async (workspaceId: string, privacyPolicyId: number, errCb?): Promise<any> => {
        return await doRequest(apiInstance.post(`/workspaces/${workspaceId}/privacy-policy/${privacyPolicyId}/restart-acceptance`), undefined, errCb);
    },
};
