import { NewResponseModel } from '~/interfaces/new-response-model';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetCategorizationCsvProps } from './interfaces';

export const getCategorizationCsv = async (
  workspaceId: string,
  body: NewResponseModel<GetCategorizationCsvProps>
): Promise<Blob> => {
  return doRequest(
    apiInstance.post(`/workspaces/${workspaceId}/conversation-categorizations/get-csv`, body, {
      responseType: 'blob',
    })
  );
};
