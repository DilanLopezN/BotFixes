import { useParams } from 'react-router-dom';
import { ErrorMessage } from '~/components/error-message';
import { LinkToHome } from '~/components/link-to-home';
import { SpinnerContainer } from '~/components/spinner-container';
import { useWorkspaceList } from '~/hooks/use-workspace-list';
import type { WorkspaceValidatorProps } from './interfaces';

export const WorkspaceValidator = ({ children }: WorkspaceValidatorProps) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: paginatedWorkspaceList, isLoading } = useWorkspaceList();

  const { data: workspaceList } = paginatedWorkspaceList || {};

  const isWorkSpaceValid = workspaceList?.some((workspace) => workspace._id === workspaceId);

  if (isLoading) {
    return <SpinnerContainer message='Carregando workspaces...' />;
  }

  if (!isWorkSpaceValid) {
    return (
      <ErrorMessage
        description={
          <span>
            Workspace inválido. <LinkToHome>Ir para home</LinkToHome>
          </span>
        }
      />
    );
  }

  return children;
};
