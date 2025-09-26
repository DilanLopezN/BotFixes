import type { Me } from '~/interfaces/me';
import type { UserPermission } from '~/interfaces/user-permission';
import type { Workspace } from '~/interfaces/workspace';

export interface MenuList {
  key: string;
  label: React.ReactNode;
  type?: string;
  allowedRoles?: UserPermission[];
  hasPermission?: (user: Me, workspace: Workspace) => boolean | undefined;
  children?: MenuList[];
}
