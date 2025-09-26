import { Workspace } from '../../../../../../model/Workspace';
import { User } from 'kissbot-core';

export interface EmailSendingSettingListProps {
    loggedUser: User;
    selectedWorkspace: Workspace;
}