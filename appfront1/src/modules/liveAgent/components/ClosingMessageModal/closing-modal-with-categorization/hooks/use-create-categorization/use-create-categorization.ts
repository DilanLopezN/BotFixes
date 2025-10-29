import { notification } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../../../../model/ApiError';
import { createConversationCategorization } from '../../../../../service/create-conversation-categorization';
import { CreateCategorizationParams } from '../../interfaces';

export const useCreateCategorization = (getTranslation: (text: string) => string) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isCreatingCategorization, setIsCreatingCategorization] = useState(false);
    const [createCategorizationError, setCreateCategorizationError] = useState<ApiError>();

    const createCategorization = async (params: CreateCategorizationParams): Promise<boolean> => {
        if (!selectedWorkspace || isCreatingCategorization) return false;

        try {
            setCreateCategorizationError(undefined);
            setIsCreatingCategorization(true);
            await createConversationCategorization(selectedWorkspace?._id, { data: params });
            setIsCreatingCategorization(false);
            return true;
        } catch (error) {
            notification.error({
                message: getTranslation('Error'),
                description: getTranslation('Error finalizing conversation'),
            });
            setCreateCategorizationError(error as ApiError);
            setIsCreatingCategorization(false);
            return false;
        }
    };

    return {
        createCategorization,
        isCreatingCategorization,
        createCategorizationError,
    };
};
