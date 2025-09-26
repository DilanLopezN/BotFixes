import { User } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { Team } from './../../../../model/Team';

export interface ConversationSearchListProps {
    selectConversation: (conversationId: string) => void;
    loggedUser: User;
    workspaceId: string;
    appliedFilters: any;
    socketConnection?: Socket;
    teams: Team[];
    appliedTextFilter: string;
}
