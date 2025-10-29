import { ConversationTabFilter, User } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { Team } from '../../../../model/Team';

export interface FilterProps {
    loggedUser: User;
    onFiltersApply: (...params) => any;
    onNewConversation: (...params) => any;
    onApplyConversationsFilter: (...params) => any;
    appliedFilters: AppliedFilters;
    onOpenContactList: (...params) => any;
    onCreateContact: (...params) => any;
    socketConnection: Socket;
    workspaceId: string;
    tabQueries: { [key: string]: any } | undefined;
    onApplyTextFilter: (value: string | undefined) => void;
    teams: Team[];
}

export interface InfinityOptions {
    limit: number;
    actual: number;
    hasMore: boolean;
    setAttribute: Function;
}
export interface SortFilters {
    direction: ('asc' | 'desc')[];
    field: string[];
}

export interface AppliedFilters {
    tab: ConversationTabFilter;
    sort: SortFilters;
    formValues: { [key: string]: any };
    search: string;
}

export const sortTypes = {
    [ConversationTabFilter.all]: {
        direction: ['desc'],
        field: ['createdAt'],
    },
    [ConversationTabFilter.awaitAgent]: {
        direction: ['asc'],
        field: ['order', 'createdAt'],
    },
    [ConversationTabFilter.bot]: {
        direction: ['asc'],
        field: ['order', 'createdAt'],
    },
    [ConversationTabFilter.inbox]: {
        direction: ['asc'],
        field: ['order', 'createdAt'],
    },
    [ConversationTabFilter.teams]: {
        direction: ['asc'],
        field: ['order', 'createdAt'],
    },
    [ConversationTabFilter.smt_re]: {
        direction: ['asc'],
        field: ['order', 'createdAt'],
    },
} as { [key in ConversationTabFilter]: SortFilters };
