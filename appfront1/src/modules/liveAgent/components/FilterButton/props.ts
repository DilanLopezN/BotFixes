import { ConversationTabFilter } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { Team } from '../../../../model/Team';

export interface FilterButtonProps {
    type: ConversationTabFilter;
    tabSelected: ConversationTabFilter;
    title: string;
    icon: string;
    onClick: Function;
    tabQuery: any;
    workspaceId: string;
    showCount?: boolean;
    socketConnection?: Socket;
    appliedFilters?: any;
    teams?: Team[];
}