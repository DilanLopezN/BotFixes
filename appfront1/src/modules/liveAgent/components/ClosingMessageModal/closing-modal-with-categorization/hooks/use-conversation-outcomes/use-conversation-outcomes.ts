import { notification } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { v2ResponseModel } from '../../../../../../../interfaces/v2-response-model';
import { ApiError } from '../../../../../../../model/ApiError';
import { useLanguageContext } from '../../../../../../i18n/context';
import { ConversationOutcome } from '../../../../../interfaces/conversation-outcome';
import { getConversationOutcomes } from '../../../../../service/get-conversation-outcomes';

export const useConversationOutcomes = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [conversationOutcomes, setConversationOutcomes] = useState<v2ResponseModel<ConversationOutcome[]>>();
    const [isFetchingConversationOutcomes, setIsFetchingConversationOutcomes] = useState(true);
    const [fetchConversationOutcomesError, setFetchConversationOutcomesError] = useState<ApiError>();
    const { getTranslation } = useLanguageContext();

    const fetchConversationOutcomes = useCallback(async () => {
        try {
            setFetchConversationOutcomesError(undefined);
            setIsFetchingConversationOutcomes(true);
            const result = await getConversationOutcomes(selectedWorkspace?._id, { data: {} });
            setConversationOutcomes(result);
            setIsFetchingConversationOutcomes(false);
            return true;
        } catch (error) {
            notification.error({
                message: getTranslation('Error'),
                description: getTranslation('Error loading outcomes'),
            });
            setFetchConversationOutcomesError(error as ApiError);
            setIsFetchingConversationOutcomes(false);
            return false;
        }
    }, [getTranslation, selectedWorkspace?._id]);

    useEffect(() => {
        fetchConversationOutcomes();
    }, [fetchConversationOutcomes]);

    return {
        fetchConversationOutcomes,
        conversationOutcomes,
        isFetchingConversationOutcomes,
        fetchConversationOutcomesError,
    };
};
