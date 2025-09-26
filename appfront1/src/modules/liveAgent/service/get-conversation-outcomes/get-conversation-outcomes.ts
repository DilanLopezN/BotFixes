import { v2ResponseModel } from '../../../../interfaces/v2-response-model';
import { apiInstance } from '../../../../utils/Http';
import { ConversationOutcome } from '../../interfaces/conversation-outcome';
import type { GetConversationOutcomesProps } from './interfaces';

export const getConversationOutcomes = async (
    workspaceId: string,
    payload: GetConversationOutcomesProps
): Promise<v2ResponseModel<ConversationOutcome[]>> =>
    (await apiInstance.post(`workspaces/${workspaceId}/conversation-outcomes/get-conversation-outcomes`, payload))
        ?.data;
