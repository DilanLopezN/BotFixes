import { User } from 'kissbot-core';
import { Workspace } from '../../../../model/Workspace';

export interface UserUpdateFormProps {
  targetUser?: User;
  selectedWorkspace: Workspace;
  loggedUser: User;
  onRemove(): void;
  addNotification(args: any): any;
  onCancel(): void;
  location: any;
  loadingRequest: boolean;
}
