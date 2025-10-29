import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetSendingListByWorkspaceIdParams, SendingList } from './interfaces';

export const getSendingListByWorkspaceId = async (
  { workspaceId, ...otherParams }: GetSendingListByWorkspaceIdParams,
  queryString: string
): Promise<SendingList> => {
  return doRequest(
    apiInstance.post(`/workspaces/${workspaceId}/schedules${queryString}`, otherParams)
  );
};
