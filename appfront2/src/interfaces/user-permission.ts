import { UserRoles } from '~/constants/user-roles';
import { PermissionResources } from '../constants/permission-resources';

export interface UserPermission {
  role: UserRoles;
  resource: PermissionResources;
  resourceId?: string;
}
