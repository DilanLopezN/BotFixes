import { apiInstance, doRequest } from '~/services/api-instance';

export const deleteConversationOutcomes = async (
  workspaceId: string,
  conversationOutcomeIdList: number[]
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-outcomes/do-delete-conversation-outcomes`,
      {
        data: { conversationOutcomeIds: conversationOutcomeIdList },
      }
    )
  );
