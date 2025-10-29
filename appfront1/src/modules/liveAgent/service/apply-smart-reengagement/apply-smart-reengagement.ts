import { apiInstance } from '../../../../utils/Http';
import { ApplySmartReengagementPayload, SmartReengagementResponse } from './interfaces';

export const applySmartReengagement = async (
    workspaceId: string,
    conversationId: string,
    smtReSettingId: string
): Promise<SmartReengagementResponse> => {
    const payload: ApplySmartReengagementPayload = { smtReSettingId };
    const response = await apiInstance.post(
        `workspaces/${workspaceId}/conversations/${conversationId}/smart-reengagement`,
        payload
    );
    return response.data;
};
