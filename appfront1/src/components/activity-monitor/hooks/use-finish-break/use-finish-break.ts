import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../interfaces/api-error';
import { apiInstance } from '../../../../utils/Http';
import { notifyError } from '../../../../utils/notify-error';
import { FinishBreakProps } from './interfaces';

export const useFinishBreak = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isFinishingBreak, setIsFinishingBreak] = useState(false);
    const [finishBreakError, setFinishBreakError] = useState<ApiError>();

    const finishUserBreak = useCallback(
        async (values: FinishBreakProps) => {
            try {
                setFinishBreakError(undefined);
                setIsFinishingBreak(true);
                await apiInstance.post(
                    `workspaces/${selectedWorkspace?._id}/agentStatus/workingTimeEndBreakAndConnect`,
                    values
                );
                setIsFinishingBreak(false);
                return true;
            } catch (error) {
                notifyError('Erro ao finalizar pausa');
                setFinishBreakError(error as ApiError);
                setIsFinishingBreak(false);
                return false;
            }
        },
        [selectedWorkspace?._id]
    );

    return {
        isFinishingBreak,
        finishBreakError,
        finishUserBreak,
    };
};
