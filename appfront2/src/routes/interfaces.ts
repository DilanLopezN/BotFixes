import type { Me } from '~/interfaces/me';
import type { UserPermission } from '~/interfaces/user-permission';
import type { Workspace } from '~/interfaces/workspace';
import type { RouteType } from './constants';

export interface RouteChild {
  path: string;
  element: React.ReactNode;
  type?: RouteType;
  hasPermission?: (user: Me, workspace: Workspace) => boolean | undefined;
  allowedRoles?: UserPermission[];
  children?: Record<string, RouteChild>;
  fullPath: string;
}

export type RouteNodes = Record<string, RouteChild>;
