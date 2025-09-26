import type { ConversationObjective } from '~/interfaces/conversation-objective';
import type { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetConversationObjectivesProps } from './interfaces';

export const getConversationObjectives = async (
  workspaceId: string,
  payload: GetConversationObjectivesProps
): Promise<NewResponseModel<ConversationObjective[]>> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-objectives/get-conversation-objectives`,
      payload
    )
  );
