import { User } from 'kissbot-core';
import { ChannelConfig } from '../../../../model/Bot';

export interface ActiveMessageProps{
    menuSelected: any;
    match: any;
    loggedUser: User;
    workspaceId: string;
    addNotification: Function;
    history: any;
    location: any;
    workspaceChannelList?: ChannelConfig[];
    setWorkspaceChannelList: Function;
}