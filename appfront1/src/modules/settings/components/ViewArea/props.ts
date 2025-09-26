import { Workspace } from './../../../../model/Workspace';

export interface ViewAreaProps {
    menuSelected?: any;
    addNotification?: Function;
    loggedUser: any;
    selectedWorkspace: Workspace;
    match?: any;
}