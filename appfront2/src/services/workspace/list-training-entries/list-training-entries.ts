import { PaginatedModel } from '~/interfaces/paginated-model';
import { TrainingEntry } from '~/interfaces/training-entry';
import { apiInstance, doRequest } from '~/services/api-instance';

export const listTrainingEntries = (
  workspaceId: string
): Promise<PaginatedModel<TrainingEntry>> => {
  return doRequest(
    apiInstance.post(
      `/workspaces/${workspaceId}/conversation-ai/training-entry/listTrainingEntries`
    )
  );
};
