import { useNavigate } from 'react-router-dom';
import { SpinnerContainer } from '~/components/spinner-container';
import { useAuth } from '~/hooks/use-auth';
import { routes } from '~/routes';
import { isLocalHost } from '~/utils/is-local-host';
import { AppTypePort, redirectApp } from '~/utils/redirect-app';
import type { AuthProps } from './interface';
import { RolePermissions } from './role-pemissions';
import { WorkspaceValidator } from './workspace-validator';

export const Auth = ({
  children,
  allowedRoles,
  hasPermission,
  isParentAuthenticated,
}: AuthProps) => {
  const { isAuth, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const { login } = routes;

  if (isAuthenticating) {
    return <SpinnerContainer message='Autenticando...' />;
  }

  const rolePermissionsElement = (
    <RolePermissions allowedRouteRoles={allowedRoles} hasPermission={hasPermission}>
      {children}
    </RolePermissions>
  );

  if (isParentAuthenticated) {
    return rolePermissionsElement;
  }

  if (!isAuth) {
    if (isLocalHost) {
      navigate(`/${login.path}`);
      return <> </>;
    }

    redirectApp({
      pathname: 'users/login',
      queryString: `?redirect_url=${window.location.href}`,
      appTypePort: AppTypePort.APP,
    });
    return <> </>;
  }

  return <WorkspaceValidator>{rolePermissionsElement}</WorkspaceValidator>;
};
