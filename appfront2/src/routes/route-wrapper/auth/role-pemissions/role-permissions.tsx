import { ErrorMessage } from '~/components/error-message';
import { LinkToHome } from '~/components/link-to-home';
import { useAuth } from '~/hooks/use-auth';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import type { RolePermissionsProps } from './interfaces';

export const RolePermissions = ({
  allowedRouteRoles,
  children,
  hasPermission,
}: RolePermissionsProps) => {
  const { user } = useAuth();
  const selectedWorkspace = useSelectedWorkspace();

  const userRoles = user?.roles;

  if (!user) {
    return <> </>;
  }

  if (hasPermission && !hasPermission(user, selectedWorkspace)) {
    return (
      <ErrorMessage
        description={
          <span>
            Rota desabilitada pelo administrador. <LinkToHome>Ir para home</LinkToHome>
          </span>
        }
      />
    );
  }

  if (
    allowedRouteRoles &&
    !userRoles?.some((userRole) =>
      allowedRouteRoles.some(
        (allowedRouteRole) =>
          allowedRouteRole.role === userRole.role && allowedRouteRole.resource === userRole.resource
      )
    )
  ) {
    return (
      <ErrorMessage
        description={
          <span>
            Rota não autorizada. <LinkToHome>Ir para home</LinkToHome>
          </span>
        }
      />
    );
  }

  return children;
};
