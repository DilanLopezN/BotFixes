import { apiInstance, doRequest } from '~/services/api-instance';

export const deleteConversationObjectives = async (
  workspaceId: string,
  conversationObjectiveIdList: number[]
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-objectives/do-delete-conversation-objectives`,
      {
        data: { conversationObjectiveIds: conversationObjectiveIdList },
      }
    )
  );
