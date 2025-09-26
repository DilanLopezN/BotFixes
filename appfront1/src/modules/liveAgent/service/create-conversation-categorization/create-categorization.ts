import { apiInstance } from '../../../../utils/Http';
import type { CreateConversationCategorizationProps } from './interfaces';

export const createConversationCategorization = async (
    workspaceId: string,
    payload: CreateConversationCategorizationProps
): Promise<any> => {
    const { conversationId, userId, ...rest } = payload.data;

    return (
        await apiInstance.put(
            `workspaces/${workspaceId}/conversations/${conversationId}/members/${userId}/close-categorization`,
            rest
        )
    )?.data;
};
