import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BotService } from '../../../../services/BotService';

export const usePendingInteraction = () => {
    const { workspaceId = '', botId = '' } = useParams<{ workspaceId: string; botId: string }>();
    const fetchPendingInteraction = useCallback(async () => {
        let error: any;
        await BotService.getInteractionsPendingPublication(
            workspaceId,
            botId,
            (responseError) => (error = responseError)
        );

        if (error?.error === 'INTERACTIONS_PENDING_PUBLICATION') {
            return error.message;
        }
        return;
    }, [botId, workspaceId]);

    return {
        fetchPendingInteraction,
    };
};
