import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { connectUser } from '~/services/workspace/connect-user';
import { notifyError } from '~/utils/notify-error';

export const useConnectUser = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<ApiError>();

  const connect = useCallback(async () => {
    try {
      setConnectError(undefined);
      setIsConnecting(true);
      await connectUser(workspaceId);
      setIsConnecting(false);
      return true;
    } catch (error) {
      notifyError('Erro ao conectar');
      setConnectError(error as ApiError);
      setIsConnecting(false);
      return false;
    }
  }, [workspaceId]);

  return {
    isConnecting,
    connectError,
    connect,
  };
};
