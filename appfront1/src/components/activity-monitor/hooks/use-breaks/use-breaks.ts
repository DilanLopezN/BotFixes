import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../interfaces/api-error';
import { BreakTime } from '../../../../interfaces/break-time';
import { apiInstance } from '../../../../utils/Http';
import { notifyError } from '../../../../utils/notify-error';

export const useBreaks = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [breaks, setBreaks] = useState<BreakTime[]>();
    const [isFetchingBreaks, setIsFetchingBreaks] = useState(true);
    const [fetchBreaksError, setFetchBreaksError] = useState<ApiError>();

    const fetchBreaks = useCallback(async () => {
        try {
            setFetchBreaksError(undefined);
            setIsFetchingBreaks(true);
            const response = (
                await apiInstance.post(`workspaces/${selectedWorkspace?._id}/agentStatus/breakSettingFindAll`, {
                    enabled: true,
                })
            ).data;
            setBreaks(response.data);
            setIsFetchingBreaks(false);
            return true;
        } catch (error) {
            notifyError('Erro ao carregar pausas');
            setFetchBreaksError(error as ApiError);
            setIsFetchingBreaks(false);
            return false;
        }
    }, [selectedWorkspace?._id]);

    return {
        breaks,
        isFetchingBreaks,
        fetchBreaksError,
        fetchBreaks,
    };
};
