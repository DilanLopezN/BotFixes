import { UserPermission } from '~/interfaces/user-permission';

export interface UpdateUserProps {
  name: string;
  role: UserPermission;
  subRoles: UserPermission[];
}
