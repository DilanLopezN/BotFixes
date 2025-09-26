import { User } from 'kissbot-core';

export interface CustomFlowProps{
    menuSelected: any;
    match: any;
    loggedUser: User;
    workspaceId: string;
    addNotification: Function;
    history: any;
    location: any;
}