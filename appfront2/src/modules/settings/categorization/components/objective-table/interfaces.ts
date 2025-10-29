import { ConversationObjective } from '~/interfaces/conversation-objective';

export interface ObjectiveTableProps {
  conversationObjectives: ConversationObjective[];
  isLoading?: boolean;
  fetchConversationObjective: () => Promise<boolean>;
}
