import { DistributionRuleData } from '~/modules/settings/automatic-distribution/interfaces';
import { apiInstance, doRequest } from '~/services/api-instance';

export const getDistributionRuleById = async (workspaceId: string): Promise<DistributionRuleData> =>
  doRequest(
    apiInstance.get(`/conversation-automatic-distribution/${workspaceId}/distribution-rule`)
  );
