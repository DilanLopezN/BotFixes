import { NewRequestModel } from '~/interfaces/new-request-model';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type {
  GetConversationCategorizationProps,
  GetConversationCategorizationResponse,
} from './interfaces';

export const getConversationCategorizations = async (
  workspaceId: string,
  payload: NewRequestModel<GetConversationCategorizationProps>
): Promise<NewResponseModel<GetConversationCategorizationResponse>> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-categorizations/get-conversation-categorizations`,
      payload
    )
  );
