import { User } from 'kissbot-core';
import { Workspace } from './../../../../model/Workspace';

export interface UserListProps {
  selectedWorkspace: Workspace;
  onUserSelect(user: User): void;
  messageUserLimit: {planUserLimit: any, userCount: any};
}
