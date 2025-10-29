import { User } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { Team } from './../../../../model/Team';
import { ChannelConfig } from "../../../../model/Bot";

export interface ConversationDetailsProps {
    selectedConversation: any;
    onConversationSelected: Function;
    workspaceId: string;
    notification: Function;
    readingMode: boolean;
    socketConnection: Socket | undefined;
    loggedUser: User;
    channelList: ChannelConfig[];
    teams: Team[];
}