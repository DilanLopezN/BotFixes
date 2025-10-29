import { User } from 'kissbot-core';

export interface HangTagsWrapperProps{
    menuSelected: any;
    match: any;
    loggedUser: User;
    workspaceId?: string | undefined;
    addNotification: Function;
    history: any;
    location: any;
}