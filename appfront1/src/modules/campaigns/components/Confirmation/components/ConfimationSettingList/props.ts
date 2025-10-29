import { Workspace } from '../../../../../../model/Workspace';
import { User } from 'kissbot-core';

export interface ConfirmationSettingListProps {
    loggedUser: User;
    selectedWorkspace: Workspace;
}