import { Link, generatePath, useParams } from 'react-router-dom';
import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import type { MenuNavigatorProps } from './interfaces';

export const MenuNavigator = ({ appTypePort, pathname, children }: MenuNavigatorProps) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const pathnameWithWorkspaceId = generatePath(pathname, { workspaceId });

  if (appTypePort === AppTypePort.V2) {
    return <Link to={pathnameWithWorkspaceId}>{children}</Link>;
  }

  const url = getBaseUrl({ pathname: pathnameWithWorkspaceId, appTypePort });

  return <Link to={url}>{children}</Link>;
};
