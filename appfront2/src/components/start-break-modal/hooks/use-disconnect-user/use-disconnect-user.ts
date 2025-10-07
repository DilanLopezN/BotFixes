import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '~/interfaces/api-error';
import { disconnectUser } from '~/services/workspace/disconnect-user';
import { notifyError } from '~/utils/notify-error';

export const useDisconnectUser = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<ApiError>();

  const disconnect = useCallback(async () => {
    try {
      setDisconnectError(undefined);
      setIsDisconnecting(true);
      await disconnectUser(workspaceId);
      setIsDisconnecting(false);
      return true;
    } catch (error) {
      notifyError('Erro ao desconectar');
      setDisconnectError(error as ApiError);
      setIsDisconnecting(false);
      return false;
    }
  }, [workspaceId]);

  return {
    isDisconnecting,
    disconnectError,
    disconnect,
  };
};
