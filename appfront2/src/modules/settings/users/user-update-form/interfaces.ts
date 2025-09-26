import { UserRoles } from '~/constants/user-roles';

export interface UserUpdateFormProps {
  name: string;
  permission: UserRoles;
  subRoles: UserRoles[];
}

export const workspaceSubRolesList = {
  [UserRoles.DASHBOARD_ADMIN]: UserRoles.DASHBOARD_ADMIN,
};
