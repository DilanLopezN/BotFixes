import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../../../interfaces/api-error.interface';
import { BotAttribute } from '../../../../model/BotAttribute';
import { PaginatedModel } from '../../../../model/PaginatedModel';
import { BotService } from '../../../../modules/bot/services/BotService';

export const useCreateBotAttribute = () => {
    const { workspaceId = '', botId = '' } = useParams<{ workspaceId: string; botId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);

    const createBotAttribute = async (attribute: BotAttribute) => {
        try {
            setIsLoading(true);
            setError(null);
            await BotService.createBotAttribute(workspaceId, botId, attribute);
            const botAttrList: PaginatedModel<BotAttribute> = await BotService.getBotAttributes(workspaceId, botId);
            return botAttrList.data;
        } catch (err) {
            setError(err as ApiError);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { createBotAttribute, error, isLoading };
};
