import { DeleteTrainingEntryDto } from '~/interfaces/training-entry';
import { apiInstance, doRequest } from '~/services/api-instance';

export const deleteTrainingEntry = (
  workspaceId: string,
  dto: DeleteTrainingEntryDto
): Promise<{ success: boolean }> => {
  return doRequest(
    apiInstance.post(
      `/workspaces/${workspaceId}/conversation-ai/training-entry/deleteTrainingEntry`,
      dto
    )
  );
};
