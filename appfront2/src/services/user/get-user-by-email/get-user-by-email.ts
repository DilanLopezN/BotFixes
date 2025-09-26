import { Me } from '~/interfaces/me';
import { PaginatedModel } from '~/interfaces/paginated-model';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getUserByEmail = async (email: string): Promise<PaginatedModel<Me>> =>
  doRequest(apiInstance.get(`/users?email=${email}`));
