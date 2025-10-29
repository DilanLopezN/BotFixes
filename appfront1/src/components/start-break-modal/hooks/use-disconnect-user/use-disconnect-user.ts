import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../interfaces/api-error';
import { apiInstance } from '../../../../utils/Http';
import { notifyError } from '../../../../utils/notify-error';

export const useDisconnectUser = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [disconnectError, setDisconnectError] = useState<ApiError>();

    const disconnect = useCallback(async () => {
        try {
            setDisconnectError(undefined);
            setIsDisconnecting(true);
            await apiInstance.post(`workspaces/${selectedWorkspace?._id}/agentStatus/workingTimeDisconnect`);
            setIsDisconnecting(false);
            return true;
        } catch (error) {
            notifyError('Erro ao desconectar');
            setDisconnectError(error as ApiError);
            setIsDisconnecting(false);
            return false;
        }
    }, [selectedWorkspace?._id]);

    return {
        isDisconnecting,
        disconnectError,
        disconnect,
    };
};
