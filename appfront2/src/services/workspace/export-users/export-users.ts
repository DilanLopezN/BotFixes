import { apiInstance, doRequest } from '~/services/api-instance';
import { ExportUsersParams } from './interfaces';

export const exportUsers = async ({
  workspaceId,
  status,
  downloadType,
  search,
}: ExportUsersParams): Promise<Blob> =>
  doRequest(
    apiInstance.get(`workspaces/${workspaceId}/users/export`, {
      params: { status, downloadType, search },
      responseType: 'blob',
    })
  );
