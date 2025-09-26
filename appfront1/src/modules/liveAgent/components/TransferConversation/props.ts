import { User } from 'kissbot-core';
import { Team } from '../../../../model/Team';
import { ConversationCardData } from '../ConversationCard/props';

export interface TransferConversationProps {
    conversation: ConversationCardData;
    teams: Team[];
    loggedUser: User;
    workspaceId: string;
    notification: Function;
}
