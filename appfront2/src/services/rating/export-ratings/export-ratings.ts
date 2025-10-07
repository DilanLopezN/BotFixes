import { apiInstance, doRequest } from '~/services/api-instance';
import { ExportRatingsRequest } from './interfaces';

export const exportRatings = async (
  workspaceId: string,
  filters: ExportRatingsRequest
): Promise<Blob> => {
  return doRequest(
    apiInstance.get(`/rating/workspaces/${workspaceId}/ratings/exportCSV`, {
      params: filters,
      responseType: 'blob',
    })
  );
};
