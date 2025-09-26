import { User } from 'kissbot-core';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';

export interface ChatContainerHeaderProps {
    conversation: any;
    workspaceId?: string;
    loggedUser: User;
    notification: Function;
    readingMode: boolean;
    disabled: boolean;
    teams: Team[];
    groupedMessages: any;
    channels: ChannelConfig[];
    onUpdatedConversationSelected: Function;
}

export interface ActionableElement {
    key: string;
    label: string;
    element: React.ReactNode;
    onClick: any;
}
