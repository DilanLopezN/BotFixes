import { Outlet, generatePath, useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceEffect } from '~/hooks/use-workspace-effect';
import { routes } from '~/routes';

export const Users = () => {
  const navigate = useNavigate();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { fullPath: userFullPath } = routes.modules.children.settings.children.users;

  useWorkspaceEffect(() => {
    const path = generatePath(userFullPath, { workspaceId });
    navigate(path, { replace: true });
  });

  return <Outlet />;
};
