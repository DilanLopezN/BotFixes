import { User } from 'kissbot-core';

export interface CancelReasonProps{
    menuSelected: any;
    match: any;
    loggedUser: User;
    workspaceId: string;
    addNotification: Function;
    history: any;
    location: any;
}