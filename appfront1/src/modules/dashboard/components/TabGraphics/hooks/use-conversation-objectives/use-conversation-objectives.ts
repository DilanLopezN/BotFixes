import { notification } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../../../interfaces/api-error.interface';
import { v2ResponseModel } from '../../../../../../interfaces/v2-response-model';
import { useLanguageContext } from '../../../../../i18n/context';
import { ConversationObjective } from '../../../../../liveAgent/interfaces/conversation-objective';
import { getConversationObjectives } from '../../../../../liveAgent/service/get-conversation-objectives';

export const useConversationObjectives = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [conversationObjectives, setConversationObjectives] = useState<v2ResponseModel<ConversationObjective[]>>();
    const [isFetchingConversationObjectives, setIsFetchingConversationObjectives] = useState(true);
    const [fetchConversationObjectivesError, setFetchConversationObjectivesError] = useState<ApiError>();
    const { getTranslation } = useLanguageContext();

    const fetchConversationObjective = useCallback(async () => {
        try {
            setFetchConversationObjectivesError(undefined);
            setIsFetchingConversationObjectives(true);
            const response = await getConversationObjectives(selectedWorkspace?._id, { data: {} });
            setConversationObjectives(response);
            setIsFetchingConversationObjectives(false);
            return true;
        } catch (error) {
            notification.error({
                message: getTranslation('Error'),
                description: getTranslation('Error loading objectives'),
            });
            setFetchConversationObjectivesError(error as ApiError);
            setIsFetchingConversationObjectives(false);
            return false;
        }
    }, [getTranslation, selectedWorkspace?._id]);

    useEffect(() => {
        fetchConversationObjective();
    }, [fetchConversationObjective]);

    return {
        conversationObjectives,
        isFetchingConversationObjectives,
        fetchConversationObjectivesError,
        fetchConversationObjective,
    };
};
