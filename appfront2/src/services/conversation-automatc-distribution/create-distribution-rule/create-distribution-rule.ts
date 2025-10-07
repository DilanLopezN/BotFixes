import {
  DistributionRuleCreateData,
  DistributionRuleData,
} from '~/modules/settings/automatic-distribution/interfaces';
import { apiInstance, doRequest } from '~/services/api-instance';

export const createDistributionRule = async (
  workspaceId: string,
  payload: DistributionRuleCreateData
): Promise<DistributionRuleData> =>
  doRequest(
    apiInstance.post(
      `/conversation-automatic-distribution/${workspaceId}/distribution-rule`,
      payload
    )
  );
