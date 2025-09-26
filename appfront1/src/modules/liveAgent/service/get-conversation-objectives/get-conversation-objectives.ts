import { v2ResponseModel } from '../../../../interfaces/v2-response-model';
import { apiInstance } from '../../../../utils/Http';
import { ConversationObjective } from '../../interfaces/conversation-objective';
import { GetConversationObjectivesProps } from './interfaces';

export const getConversationObjectives = async (
    workspaceId: string,
    payload: GetConversationObjectivesProps
): Promise<v2ResponseModel<ConversationObjective[]>> => {
    return (
        await apiInstance.post(`workspaces/${workspaceId}/conversation-objectives/get-conversation-objectives`, payload)
    )?.data;
};
