import { notification } from 'antd';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../../../../model/ApiError';
import { WorkspaceService } from '../../../../../../workspace/services/WorkspaceService';

export const useTemplates = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [templates, setTemplates] = useState<any[]>();
    const [isFetchingTemplates, setIsFetchingTemplates] = useState(true);
    const [fetchTemplatesError, setFetchTemplatesError] = useState<ApiError>();

    const fetchTemplates = useCallback(
        async (channelId: string, hasResponse: boolean) => {
            if (!selectedWorkspace) return;

            const query: any = {
                sort: '-createdAt',
                skip: 0,
                custom: {
                    channel: channelId,
                },
                filter: {
                    isHsm: !hasResponse ? true : undefined,
                    $or: [{ active: true }, { active: { $exists: false } }],
                    type: { $ne: 'file' },
                },
            };

            try {
                setFetchTemplatesError(undefined);
                setIsFetchingTemplates(true);
                const response = await WorkspaceService.getTemplates(query, selectedWorkspace._id);
                setTemplates(response?.data);
                setIsFetchingTemplates(false);
                return true;
            } catch (error) {
                notification.error({
                    message: 'Error',
                    description: 'Erro ao carregar templates',
                });
                setFetchTemplatesError(error as ApiError);
                setIsFetchingTemplates(false);
                return false;
            }
        },
        [selectedWorkspace]
    );

    return {
        templates,
        isFetchingTemplates,
        fetchTemplatesError,
        fetchTemplates,
    };
};
