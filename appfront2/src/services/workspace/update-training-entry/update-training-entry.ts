import { TrainingEntry, UpdateTrainingEntryDto } from '~/interfaces/training-entry';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateTrainingEntry = (
  workspaceId: string,
  dto: UpdateTrainingEntryDto
): Promise<TrainingEntry> => {
  return doRequest(
    apiInstance.post(
      `/workspaces/${workspaceId}/conversation-ai/training-entry/updateTrainingEntry`,
      dto
    )
  );
};
