import { useParams } from 'react-router-dom';
import { useWorkspaceList } from '../use-workspace-list';

export const useSelectedWorkspace = () => {
  const { workspaceId } = useParams();

  const { data: paginatedWorkspaceList } = useWorkspaceList();

  if (!workspaceId) {
    throw new Error('useSelectedWorkspace: id do workspace não encontrado.');
  }

  if (!paginatedWorkspaceList) {
    throw new Error('useSelectedWorkspace: listagem de workspace não encontrada.');
  }

  const selectedWorkspace = paginatedWorkspaceList.data.find(
    (workspace) => workspace._id === workspaceId
  );

  if (!selectedWorkspace) {
    throw new Error(`useSelectedWorkspace: workspace não encontrado para o id ${workspaceId}`);
  }

  return selectedWorkspace;
};
