import { CreateConversationObjectiveParams } from './create-conversation-objective.interface';

export interface UpdateConversationObjectiveParams extends CreateConversationObjectiveParams {
    id: number;
}
