import { apiInstance } from "../../../../utils/Http";
import { SmartReengagementResponse } from "../apply-smart-reengagement/interfaces";

export const deactivateSmartReengagement = async (
    workspaceId: string,
    conversationId: string
): Promise<SmartReengagementResponse> => {
    const response = await apiInstance.delete(
        `workspaces/${workspaceId}/conversations/${conversationId}/smart-reengagement`
    );
    return response.data;
};
