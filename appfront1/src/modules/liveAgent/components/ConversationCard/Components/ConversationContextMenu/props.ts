import { ReactNode } from 'react';
import { ConversationCardData } from '../../props';
import { User } from 'kissbot-core';
import { Team } from '../../../../../../model/Team';
import { ChannelConfig } from '../../../../../../model/Bot';

export interface ConversationContextMenuProps {
    conversation: ConversationCardData;
    children: ReactNode;
    loggedUser: User;
    workspaceId: string;
    disabled: boolean;
    onUpdatedConversationSelected?: Function;
    teams: Team[];
    channels: ChannelConfig[];
}
