import type { ConversationOutcome } from '~/interfaces/conversation-outcome';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetConversationOutcomesProps } from './interfaces';

export const getConversationOutcomes = async (
  workspaceId: string,
  payload: GetConversationOutcomesProps
): Promise<NewResponseModel<ConversationOutcome[]>> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-outcomes/get-conversation-outcomes`,
      payload
    )
  );
