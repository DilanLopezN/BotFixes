import { Conversation } from '../../../../interfaces/conversation.interface';

export interface ConversationCategorizationProps {
    workspaceId: string;
    conversation: Conversation;
    onUpdatedConversationSelected?: Function;
}

export interface FinishConversationFormValues {
    objectiveId: number;
    outcomeId: number;
}
