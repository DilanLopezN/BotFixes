import { User } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from './../../../../model/Team';

export interface ChatContainerProps {
    conversation?: any;
    socketConnection?: Socket;
    loggedUser: User;
    workspaceId?: string | undefined;
    notification: Function;
    readingMode: boolean;
    teams: Team[];
    channelList: ChannelConfig[];
    onUpdatedConversationSelected: Function;
}

export interface SidebarChatContainerProps {
    user: User;
    conversation: any;
}

export type ActivityReaction = {
    emoji: string;
    reactionHash?: string;
    fromType: string;
    fromName?: string;
};
