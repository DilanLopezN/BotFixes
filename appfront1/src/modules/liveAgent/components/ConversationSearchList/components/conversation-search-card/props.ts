import { User } from 'kissbot-core';
import { Team } from '../../../../../../model/Team';
import { ConversationSearchResult } from '../../../../interfaces/conversation.interface';

export interface ConversationSearchCardProps {
    conversationResult: ConversationSearchResult;
    onSelectConversation: (resultSearchId: string, conversationId: string) => void;
    selected: boolean;
    loggedUser: User;
    workspaceId: string;
    teams: Team[];
}
