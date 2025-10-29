import { v2ResponseModel } from '../../../../interfaces/v2-response-model';
import { apiInstance } from '../../../../utils/Http';
import {
    GetConversationCategorizationProps,
    GetConversationCategorizationResponse,
} from '../../components/ClosingMessageModal/closing-modal-with-categorization/interfaces';
import { NewRequestModel } from './interfaces';

export const getConversationCategorizations = async (
    workspaceId: string,
    payload: NewRequestModel<GetConversationCategorizationProps>
): Promise<v2ResponseModel<GetConversationCategorizationResponse>> => {
    return (
        await apiInstance.post(
            `workspaces/${workspaceId}/conversation-categorizations/get-conversation-categorizations`,
            { ...payload, limit: 1000, skip: 0 }
        )
    )?.data;
};
