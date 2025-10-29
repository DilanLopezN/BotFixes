import {
  DistributionRuleData,
  DistributionRuleUpdateData,
} from '~/modules/settings/automatic-distribution/interfaces';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateDistributionRule = async (
  workspaceId: string,
  id: string,
  payload: DistributionRuleUpdateData
): Promise<DistributionRuleData> =>
  doRequest(
    apiInstance.put(
      `/conversation-automatic-distribution/${workspaceId}/distribution-rule/${id}`,
      payload
    )
  );
