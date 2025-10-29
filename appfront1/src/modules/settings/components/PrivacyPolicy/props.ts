import { User } from 'kissbot-core';
import { Workspace } from '../../../../model/Workspace';

export interface PrivacyPolicyProps {
    history?: any;
    match?: any;
    loggedUser: User;
    menuSelected: any;
    selectedWorkspace: Workspace;
    location: any;
}
