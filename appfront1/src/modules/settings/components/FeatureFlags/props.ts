import { User } from 'kissbot-core';
import { Workspace } from '../../../../model/Workspace';

export interface FeatureFlagsProps {
    menuSelected: any;
    selectedWorkspace: Workspace;
    loggedUser: User;
    addNotification: Function;
    setWorkspace: (workspace: Workspace) => any;
}
