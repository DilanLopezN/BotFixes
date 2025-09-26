import type { ConversationCategorization } from '~/interfaces/conversation-categorization';
import type { ConversationObjective } from '~/interfaces/conversation-objective';
import type { ConversationOutcome } from '~/interfaces/conversation-outcome';

export interface GetConversationCategorizationProps {
  conversationCategorizationId?: number;
  objectiveIds?: string[];
  outcomeIds?: string[];
  conversationTags?: string[];
  userIds?: string[];
  teamIds?: string[];
  description?: string;
  startDate?: number;
  endDate?: number;
}

export type GetConversationCategorizationResponse = (ConversationCategorization & {
  user?: {
    id: string;
    name: string;
  };
  objective?: ConversationObjective;
  outcome?: ConversationOutcome;
})[];
