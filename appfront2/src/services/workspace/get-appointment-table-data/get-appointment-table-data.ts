import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetAppointmentTableDataRequest, GetAppointmentTableDataResponse } from './interfaces';

export const getAppointmentTableData = async ({
  data,
  limit,
  skip,
}: GetAppointmentTableDataRequest): Promise<GetAppointmentTableDataResponse> =>
  doRequest(
    apiInstance.post(`workspaces/${data.workspaceId}/analytics/get-conversations-appointments`, {
      data,
      limit,
      skip,
    })
  );
