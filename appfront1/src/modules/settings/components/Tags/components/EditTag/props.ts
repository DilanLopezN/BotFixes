import { User } from 'kissbot-core';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';


export interface EditTagProps {
    tag?: Tag |undefined;
    workspaceId: string;
    addNotification: Function;
    onCancel: Function;
    loggedUser: User;
    onDeletedTag: Function;
    loadingRequest: boolean;
    editing: boolean;
}