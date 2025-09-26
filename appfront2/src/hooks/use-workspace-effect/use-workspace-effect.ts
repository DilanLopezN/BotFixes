import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePreviousState } from '../use-previous-state';

export const useWorkspaceEffect = (onWorkspaceChange: () => void) => {
  const { workspaceId } = useParams();
  const previousWorkspaceId = usePreviousState(workspaceId);
  useEffect(() => {
    if (onWorkspaceChange && previousWorkspaceId && previousWorkspaceId !== workspaceId) {
      onWorkspaceChange();
    }
  }, [onWorkspaceChange, previousWorkspaceId, workspaceId]);
};
