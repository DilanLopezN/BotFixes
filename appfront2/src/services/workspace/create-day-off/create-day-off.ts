import { apiInstance, doRequest } from '~/services/api-instance';
import { CreateDayOffProps } from './interfaces';

export const createDayoff = async (workspaceId: string, payload: CreateDayOffProps): Promise<any> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/teams/createOffDays`, {
      ...payload,
    })
  );
