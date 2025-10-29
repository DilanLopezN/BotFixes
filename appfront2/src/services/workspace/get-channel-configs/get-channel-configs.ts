import type { ChannelConfig } from '~/interfaces/channel-config';
import type { PaginatedModel } from '~/interfaces/paginated-model';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getChannelsConfig = (queryString: string): Promise<PaginatedModel<ChannelConfig>> => {
  return doRequest(apiInstance.get(`/channel-configs?${queryString || ''}`));
};
