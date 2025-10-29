import { NewResponseModel } from '~/interfaces/new-response-model';
import { DoTrainingDto } from '~/interfaces/training-entry';
import { apiInstance, doRequest } from '~/services/api-instance';

export const doTraining = (
  workspaceId: string,
  dto: DoTrainingDto
): Promise<NewResponseModel<{ success: number; total: number }>> => {
  return doRequest(
    apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry/doTraining`, dto)
  );
};
