import { notification } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../../../../interfaces/api-error.interface';
import { useLanguageContext } from '../../../../../../i18n/context';
import { updateConversationCategorization } from '../../../../../service/update-conversation-categorization';
import { UpdateCategorizationParams, UpdateConversationCategorizationProps } from './interfaces';

export const useUpdateCategorization = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isUpdatingCategorization, setIsUpdatingCategorization] = useState(false);
    const [updateCategorizationError, setUpdateCategorizationError] = useState<ApiError>();
    const [updatedCategorization, setUpdatedCategorization] = useState<UpdateConversationCategorizationProps>();
    const { getTranslation } = useLanguageContext();

    const updateCategorization = async (params: UpdateCategorizationParams): Promise<boolean> => {
        if (!selectedWorkspace || isUpdatingCategorization) return false;

        try {
            setUpdateCategorizationError(undefined);
            setIsUpdatingCategorization(true);

            const response = await updateConversationCategorization(selectedWorkspace?._id, { data: params });

            setIsUpdatingCategorization(false);
            setUpdatedCategorization(response.data);
            return true;
        } catch (error) {
            notification.error({
                message: getTranslation('Error'),
                description: getTranslation('Error updating user data. Try again'),
            });
            setUpdateCategorizationError(error as ApiError);
            setIsUpdatingCategorization(false);
            return false;
        }
    };

    return {
        updateCategorization,
        isUpdatingCategorization,
        updateCategorizationError,
        updatedCategorization,
    };
};
