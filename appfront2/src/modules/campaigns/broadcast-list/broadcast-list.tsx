import { generatePath, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceEffect } from '~/hooks/use-workspace-effect';
import { routes } from '~/routes';

export const BroadcastList = () => {
  const navigate = useNavigate();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { children: broadcastModule } = routes.modules.children.campaigns.children.broadcastList;

  useWorkspaceEffect(() => {
    const path = generatePath(broadcastModule.viewBroadcastList.fullPath, { workspaceId });
    navigate(path, { replace: true });
  });

  return <Outlet />;
};
