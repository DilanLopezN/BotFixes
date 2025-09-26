import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../interfaces/api-error';
import { notifyError } from '../../../../utils/notify-error';
import { apiInstance } from '../../../../utils/Http';

export const useStartBreak = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isStartingBreak, setIsStartingBreak] = useState(false);
    const [startBreakError, setStartBreakError] = useState<ApiError>();

    const startBreak = useCallback(async (breakSettingId: number) => {
        try {
            setStartBreakError(undefined);
            setIsStartingBreak(true);
            await apiInstance.post(`workspaces/${selectedWorkspace?._id}/agentStatus/workingTimeStartBreak`, {
                breakSettingId,
            });
            setIsStartingBreak(false);
            return true;
        } catch (error) {
            notifyError('Erro ao iniciar pausa');
            setStartBreakError(error as ApiError);
            setIsStartingBreak(false);
            return false;
        }
    }, [selectedWorkspace?._id]);

    return {
        isStartingBreak,
        startBreakError,
        startBreak,
    };
};
