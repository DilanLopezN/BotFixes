import { Outlet, generatePath, useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceEffect } from '~/hooks/use-workspace-effect';
import { routes } from '~/routes';

export const Teams = () => {
  const navigate = useNavigate();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { children: teamsModule } = routes.modules.children.settings.children.teams;

  useWorkspaceEffect(() => {
    const path = generatePath(teamsModule.teamList.fullPath, { workspaceId });
    navigate(path, { replace: true });
  });

  return <Outlet />;
};
