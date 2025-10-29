import { notification } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../../../../model/ApiError';
import { WorkspaceService } from '../../../../../../workspace/services/WorkspaceService';

export const useTags = (getTranslation: (text: string) => string) => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [tags, setTags] = useState<any[]>();
    const [isFetchingTags, setIsFetchingTags] = useState(true);
    const [fetchTagsError, setFetchTagsError] = useState<ApiError>();

    const fetchTags = useCallback(async () => {
        if (!selectedWorkspace) return;
        try {
            setFetchTagsError(undefined);
            setIsFetchingTags(true);
            const response = await WorkspaceService.workspaceTags(selectedWorkspace._id);
            setTags(response?.data);
            setIsFetchingTags(false);
            return true;
        } catch (error) {
            notification.error({
                message: getTranslation('Error'),
                description: getTranslation('Error loading tags'),
            });
            setFetchTagsError(error as ApiError);
            setIsFetchingTags(false);
            return false;
        }
    }, [getTranslation, selectedWorkspace]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    return {
        tags,
        isFetchingTags,
        fetchTagsError,
        fetchTags,
    };
};
