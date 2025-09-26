import { Me } from '~/interfaces/me';
import { UserPermission } from '~/interfaces/user-permission';
import type { Workspace } from '~/interfaces/workspace';

export interface RolePermissionsProps {
  allowedRouteRoles?: UserPermission[];
  hasPermission?: (user: Me, workspace: Workspace) => boolean | undefined;
  children: JSX.Element;
}
