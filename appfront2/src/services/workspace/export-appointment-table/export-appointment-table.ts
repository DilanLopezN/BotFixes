import { apiInstance, doRequest } from '~/services/api-instance';
import { ExportAppointmentTableProps } from './interfaces';

export const exportAppointmentTable = async ({
  workspaceId,
  ...restProps
}: ExportAppointmentTableProps): Promise<Blob> =>
  doRequest(
    apiInstance.post(
      `workspaces/${workspaceId}/analytics/get-conversations-appointments-download`,
      { data: restProps },
      {
        responseType: 'blob',
      }
    )
  );
