import { useContext } from 'react';
import { WorkspaceContext } from '~/contexts/workspace-context';

export const useWorkspaceList = () => useContext(WorkspaceContext);
