import { PermissionResource } from '~/constants/permission-resources';
import { UserLanguage } from '~/constants/user-language';
import { UserRole } from '~/constants/user-roles';

export interface CreateUsersProps {
  name: string;
  email: string;
  password: string;
  role: {
    resource: PermissionResource;
    resourceId: string;
    role: UserRole;
  };
  // avatar: string;
  language: UserLanguage;
  passwordExpires: number;
}
