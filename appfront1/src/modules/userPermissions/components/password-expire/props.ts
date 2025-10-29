import { User } from 'kissbot-core';

export interface PasswordExpireProps {
    user: User;
    workspaceId: string;
    addNotification(args: any): any;
    onUserUpdated: (user: User) => void;
}
