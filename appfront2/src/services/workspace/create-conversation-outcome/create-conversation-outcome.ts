import { apiInstance, doRequest } from '~/services/api-instance';
import type { CreateConversationOutcomeProps } from './interfaces';

export const createConversationOutcome = async (
  workspaceId: string,
  payload: CreateConversationOutcomeProps
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-outcomes/create-conversation-outcome`,
      {
        ...payload,
      }
    )
  );
