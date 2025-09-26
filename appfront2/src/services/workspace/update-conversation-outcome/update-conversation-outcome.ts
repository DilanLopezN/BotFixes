import { apiInstance, doRequest } from '~/services/api-instance';
import type { UpdateConversationOutcomeProps } from './interfaces';

export const updateConversationOutcome = async (
  workspaceId: string,
  payload: UpdateConversationOutcomeProps
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-outcomes/update-conversation-outcome`,
      {
        ...payload,
      }
    )
  );
