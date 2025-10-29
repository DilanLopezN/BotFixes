import { UserRole } from '~/constants/user-roles';
import { PermissionResource } from '../constants/permission-resources';

export interface UserPermission {
  resource: PermissionResource;
  resourceId?: string;
  role: UserRole;
  _id?: string;
}
