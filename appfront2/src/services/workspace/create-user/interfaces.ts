import { PermissionResources } from '~/constants/permission-resources';
import { UserLanguage } from '~/constants/user-language';
import { UserRoles } from '~/constants/user-roles';

export interface CreateUsersProps {
  name: string;
  email: string;
  password: string;
  role: {
    resource: PermissionResources;
    resourceId: string;
    role: UserRoles;
  };
  // avatar: string;
  language: UserLanguage;
  passwordExpires: number;
}
