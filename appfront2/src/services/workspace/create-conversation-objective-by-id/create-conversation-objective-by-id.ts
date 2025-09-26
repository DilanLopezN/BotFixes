import { apiInstance, doRequest } from '~/services/api-instance';
import type { CreateConversationObjectiveProps } from './interfaces';

export const createConversationObjectiveById = async (
  workspaceId: string,
  payload: CreateConversationObjectiveProps
): Promise<any> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/conversation-objectives/create-conversation-objective`,
      {
        ...payload,
      }
    )
  );
