import { useCallback, useState } from 'react';
import { ApiError } from '../../../../interfaces/api-error';
import { apiInstance } from '../../../../utils/Http';
import { notifyError } from '../../../../utils/notify-error';
import { useSelector } from 'react-redux';

export const useConnectUser = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<ApiError>();

    const connect = useCallback(async () => {
        try {
            setConnectError(undefined);
            setIsConnecting(true);
            await apiInstance.post(`workspaces/${selectedWorkspace?._id}/agentStatus/workingTimeConnect`);
            setIsConnecting(false);
            return true;
        } catch (error) {
            notifyError('Erro ao conectar');
            setConnectError(error as ApiError);
            setIsConnecting(false);
            return false;
        }
    }, [selectedWorkspace?._id]);

    return {
        isConnecting,
        connectError,
        connect,
    };
};
