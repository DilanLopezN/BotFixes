import { apiInstance, doRequest } from '~/services/api-instance';
import type { UpdateConversationObjectiveProps } from './interfaces';

export const updateConversationObjective = async (
  workspaceId: string,
  payload: UpdateConversationObjectiveProps
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-objectives/update-conversation-objective`,
      {
        ...payload,
      }
    )
  );
