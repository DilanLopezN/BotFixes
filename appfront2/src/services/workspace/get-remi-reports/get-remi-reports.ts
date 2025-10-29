import { apiInstance, doRequest } from '~/services/api-instance';
import { GetRemiReportsProps, GetRemiReportsResponse } from './interfaces';

export const getRemiReports = async (
  workspaceId: string,
  props: GetRemiReportsProps
): Promise<GetRemiReportsResponse> =>
  doRequest(apiInstance.post(`/workspaces/${workspaceId}/smt-re-analytics/report`, props));
