import { ConversationCategorization } from '../models/conversation-categorization.entity';
import { ConversationObjective } from '../../conversation-objective-v2/models/conversation-objective.entity';
import { ConversationOutcome } from '../../conversation-outcome-v2/models/conversation-outcome.entity';

export interface GetConversationCategorizationParams {
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

export interface GetConversationCategorizationResponse extends ConversationCategorization {
    user?: {
        id: string;
        name: string;
    };
    objective?: ConversationObjective;
    outcome?: ConversationOutcome;
}
