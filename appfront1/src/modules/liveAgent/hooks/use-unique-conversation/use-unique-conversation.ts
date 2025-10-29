import { useCallback, useState } from 'react';
import { ApiError } from '../../../../interfaces/api-error.interface';
import { Conversation } from '../../interfaces/conversation.interface';
import { LiveAgentService } from '../../service/LiveAgent.service';

export const useFetchUniqueConversation = (onUpdate?: Function) => {
    const [conversation, setConversation] = useState<Conversation | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | undefined>(undefined);

    const fetchData = useCallback(
        async (workspaceId?: string, conversationId?: string): Promise<Conversation | undefined> => {
            if (!workspaceId || !conversationId) {
                setConversation(undefined);
                setError(undefined);
                setIsLoading(false);
                return undefined;
            }

            setIsLoading(true);
            setError(undefined);

            try {
                const data = await LiveAgentService.getUniqueConversation(conversationId, workspaceId, (err) =>
                    console.error('Erro do serviço:', err)
                );
                if (data) {
                    onUpdate?.(data);
                }
                setConversation(data);
                return data;
            } catch (err) {
                setError(err as ApiError);
                setConversation(undefined);
                return undefined;
            } finally {
                setIsLoading(false);
            }
        },
        [onUpdate]
    );

    return {
        conversation,
        isLoading,
        error,
        fetchData,
    };
};
