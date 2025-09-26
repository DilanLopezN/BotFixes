import { PermissionResources } from '~/constants/permission-resources';
import { UserRoles } from '~/constants/user-roles';

export interface Me {
  _id: string;
  name: string;
  email: string;
  timezone: string;
  loginMethod: string;
  cognitoUniqueId: string;
  roles: {
    resource: PermissionResources;
    resourceId: string;
    role: UserRoles;
    _id: string;
  }[];
  language: string;
  passwordExpires: number;
  createdAt: string;
  updatedAt: string;
  password?: string;
}
