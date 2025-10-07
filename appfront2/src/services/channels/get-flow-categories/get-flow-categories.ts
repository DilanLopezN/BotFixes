import { FlowCategory } from '~/interfaces/flow-libraries';
import { apiInstance, doRequest } from '~/services/api-instance';

export const listFlowCategories = async (): Promise<FlowCategory[]> =>
  doRequest(apiInstance.get(`/channels/whatsapp/flow-category`));
