import { User } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { ChannelConfig } from '../../../../model/Bot';
import { ConversationCardData } from '../ConversationCard/props';
import { AppliedFilters } from '../Filter/props';
import { Team } from './../../../../model/Team';

export interface ConversationListProps {
    conversations: Array<ConversationCardData>;
    selectConversation: Function;
    loggedUser: User;
    loadMore?: Function;
    loadingMore: boolean;
    workspaceId?: string;
    appliedFilters: AppliedFilters;
    socketConnection?: Socket;
    canLoadingMoreConversations: boolean;
    teams: Team[];
    channels: ChannelConfig[];
    appliedTextFilter: string | undefined;
    onUpdatedConversationSelected: Function;
}
