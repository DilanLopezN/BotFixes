import { Workspace } from '../../../../model/Workspace';
import { User } from 'kissbot-core';

export interface ConfirmationProps {
    history?: any;
    match?: any;
    loggedUser: User;
    selectedWorkspace: Workspace;
}