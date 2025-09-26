import { Workspace } from "../../../../model/Workspace";

export interface UserCreateModalProps {
  isOpened: boolean;
  selectedWorkspace: Workspace;
  onCreate(user: any): void;
  onClose(): void;
  addNotification(args: any): any;
  messageUserLimit: {planUserLimit: any, userCount: any};
}
