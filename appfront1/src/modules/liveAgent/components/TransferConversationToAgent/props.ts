import { Team } from '../../../../model/Team';
import { ConversationCardData } from '../ConversationCard/props';

export interface TransferConversationToAgentProps {
    conversation: ConversationCardData;
    teams: Team[];
    modalOpened: boolean;
    setModalOpened: (open: boolean) => void;
}
