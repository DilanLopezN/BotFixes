import { apiInstance } from '../../../../utils/Http';
import { UpdateConversationCategorizationProps } from './interfaces';

export const updateConversationCategorization = async (
    workspaceId: string,
    payload: UpdateConversationCategorizationProps
): Promise<any> => {
    return (
        await apiInstance.post(
            `workspaces/${workspaceId}/conversation-categorizations/update-conversation-categorization`,
            { ...payload, limit: 1000, skip: 0 }
        )
    )?.data;
};
