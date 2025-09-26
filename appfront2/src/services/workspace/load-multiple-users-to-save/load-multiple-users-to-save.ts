import { apiInstance, doRequest } from '~/services/api-instance';

export const loadMultipleUsersToSave = async (workspaceId: string, formData: any): Promise<any> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/users/user-batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
