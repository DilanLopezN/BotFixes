import { CreateConversationOutcomeParams } from './create-conversation-outcome.interface';

export interface UpdateConversationOutcomeParams extends CreateConversationOutcomeParams {
    id: number;
}
