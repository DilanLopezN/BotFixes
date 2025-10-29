import { CreateTrainingEntryDto, TrainingEntry } from '~/interfaces/training-entry';
import { apiInstance, doRequest } from '~/services/api-instance';

export const createTrainingEntry = (
  workspaceId: string,
  dto: CreateTrainingEntryDto
): Promise<TrainingEntry> => {
  return doRequest(
    apiInstance.post(
      `/workspaces/${workspaceId}/conversation-ai/training-entry/createTrainingEntry`,
      dto
    )
  );
};
