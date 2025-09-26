import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../../../../../interfaces/api-error.interface';
import { getConversationCategorizations } from '../../../../../service/get-conversation-categorization';
import {
    ConversationCategorization,
    GetConversationCategorizationResponse,
} from '../../../closing-modal-with-categorization/interfaces';

export const useConversationCategorizations = (workspaceId: string) => {
    const [conversationCategorizations, setConversationCategorizations] = useState<ConversationCategorization[]>();
    const [isFetchingConversationCategorizations, setIsFetchingConversationCategorizations] = useState(true);
    const [fetchConversationCategorizationsError, setFetchConversationCategorizationsError] = useState<ApiError>();

    const mapApiResponseToConversationCategorization = (
        item: GetConversationCategorizationResponse[number]
    ): ConversationCategorization => {
        return {
            id: item.id,
            iid: item.iid,
            conversationId: item.conversationId,
            objectiveId: item.objectiveId,
            outcomeId: item.outcomeId,
            userId: item.userId,
            description: item.description,
            conversationTags: item.conversationTags,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            deletedAt: item.deletedAt,
        };
    };

    const fetchConversationCategorizations = useCallback(async () => {
        try {
            setFetchConversationCategorizationsError(undefined);
            setIsFetchingConversationCategorizations(true);

            const response = await getConversationCategorizations(workspaceId, { data: {} });

            if (response && response.data) {
                const formattedData = response.data.map(mapApiResponseToConversationCategorization);
                setConversationCategorizations(formattedData);
            }

            setIsFetchingConversationCategorizations(false);
            return true;
        } catch (error) {
            setFetchConversationCategorizationsError(error as ApiError);
            setIsFetchingConversationCategorizations(false);
            return false;
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchConversationCategorizations();
    }, [fetchConversationCategorizations]);

    return {
        fetchConversationCategorizations,
        conversationCategorizations,
        isFetchingConversationCategorizations,
        fetchConversationCategorizationsError,
    };
};
