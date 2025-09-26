import type { Me } from '~/interfaces/me';
import type { UserPermission } from '~/interfaces/user-permission';
import type { Workspace } from '~/interfaces/workspace';

export interface AuthProps {
  children: JSX.Element;
  allowedRoles?: UserPermission[];
  hasPermission?: (user: Me, workspace: Workspace) => boolean | undefined;
  isParentAuthenticated?: boolean;
}
