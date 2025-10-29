import { ConversationOutcome } from '~/interfaces/conversation-outcome';

export interface OutcomeTableProps {
  conversationOutcomes: ConversationOutcome[];
  isLoading?: boolean;
  fetchConversationOutcomes: () => Promise<boolean>;
}
