import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { useWorkspaceList } from '~/hooks/use-workspace-list';
import type { ApiError } from '~/interfaces/api-error';
import { updateWorkspaceById } from '~/services/workspace/update-workspace-by-id';
import { notifyError } from '~/utils/notify-error';

export const useEnableBreaks = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { generalConfigs, ...restProps } = useSelectedWorkspace();
  const { refetch, isRefetching } = useWorkspaceList();
  const [isActivatingBreaks, setIsActivatingBreaks] = useState(false);
  const [activatingBreaksError, setActivatingBreaksError] = useState<ApiError>();

  const activateBreaks = useCallback(
    async (enableBreaks: boolean) => {
      if (isActivatingBreaks) return;

      try {
        setActivatingBreaksError(undefined);
        setIsActivatingBreaks(true);
        await updateWorkspaceById({
          ...restProps,
          _id: workspaceId,
          generalConfigs: { ...generalConfigs, enableAgentStatusForAgents: enableBreaks },
        });
        refetch();
        setIsActivatingBreaks(false);
        return true;
      } catch (error) {
        notifyError('Erro ao atualizar configuração de pausa');
        setActivatingBreaksError(error as ApiError);
        setIsActivatingBreaks(false);
        return false;
      }
    },
    [generalConfigs, isActivatingBreaks, restProps, workspaceId, refetch]
  );

  return {
    isActivatingBreaks: isActivatingBreaks || isRefetching,
    activatingBreaksError,
    activateBreaks,
  };
};
