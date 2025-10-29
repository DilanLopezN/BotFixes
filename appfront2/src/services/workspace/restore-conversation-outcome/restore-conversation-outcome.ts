import { apiInstance, doRequest } from '~/services/api-instance';

export const restoreConversationOutcome = async (
  workspaceId: string,
  conversationOutcomeId: number
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-outcomes/${conversationOutcomeId}/restore`
    )
  );
