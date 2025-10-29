import { apiInstance, doRequest } from '~/services/api-instance';

export const restoreConversationObjective = async (
  workspaceId: string,
  conversationObjectiveId: number
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-objectives/${conversationObjectiveId}/restore`
    )
  );
