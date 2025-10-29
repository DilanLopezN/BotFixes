import { UserRole } from '~/constants/user-roles';

export interface UserUpdateFormProps {
  name: string;
  email?: string;
  erpUsername?: string;
  permission: UserRole;
  subRoles: UserRole[];
}

export const workspaceSubRolesList = {
  [UserRole.DASHBOARD_ADMIN]: UserRole.DASHBOARD_ADMIN,
};
