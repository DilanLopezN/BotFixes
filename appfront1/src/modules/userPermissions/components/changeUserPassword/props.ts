import { User } from "kissbot-core";
import { Workspace } from '../../../../model/Workspace';

export interface ChangeUserPasswordProps {
    user: User;
    onClose: () => void;
    visible: boolean;
    workspaceId: string;
    addNotification(args: any): any;
    setUser:any
}
