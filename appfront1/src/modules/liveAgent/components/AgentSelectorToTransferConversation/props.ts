import { User } from 'kissbot-core';
import { Team } from '../../../../model/Team';
import { ConversationCardData } from '../ConversationCard/props';

export interface AgentSelectorToTransferConversationProps {
    teams: Team[];
    users: User[];
    onClose: Function;
    opened: boolean;
    conversation: ConversationCardData;
}
