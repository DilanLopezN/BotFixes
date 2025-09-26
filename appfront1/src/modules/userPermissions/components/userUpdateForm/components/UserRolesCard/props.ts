import { User, UserRoles } from 'kissbot-core';
import { Workspace } from '../../../../../../model/Workspace';

export interface UserRolesCardProps {
  user: User;
  role?: UserRoles;
  selectedWorkspace: Workspace;
  loggedUser: User;
  onChange(role: UserRoles): void;
}
