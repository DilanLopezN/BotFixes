import { Team } from './../../../../model/Team';
import { ConversationCardData } from '../ConversationCard/props';
import { User } from 'kissbot-core';
import { Workspace } from '../../../../model/Workspace';
import { Action } from '../../../../interfaces/ReduxAction';
import { ChannelConfig } from '../../../../model/Bot';

export interface ConversationContainerProps {
    socketConnection: any;
    conversation: ConversationCardData | undefined;
    loggedUser: User;
    onConversationSelected: (...params) => any;
    workspaceId: string;
    addNotification: (...params) => any;
    settings: any;
    teams: Team[];
    setSelectedWorkspace(workspace: Workspace): Action | Function;
    channelList: ChannelConfig[];
    onUpdatedConversationSelected: Function;
}
