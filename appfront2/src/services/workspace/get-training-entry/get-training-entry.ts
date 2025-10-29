import { GetTrainingEntryDto, TrainingEntry } from '~/interfaces/training-entry';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getTrainingEntry = (
  workspaceId: string,
  dto: GetTrainingEntryDto
): Promise<{ success: boolean; data?: TrainingEntry }> => {
  return doRequest(
    apiInstance.post(
      `/workspaces/${workspaceId}/conversation-ai/training-entry/getTrainingEntry`,
      dto
    )
  );
};
