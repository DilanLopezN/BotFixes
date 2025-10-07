import { PaginatedDistributionRules } from '~/modules/settings/automatic-distribution/interfaces';
import { apiInstance, doRequest } from '~/services/api-instance';

export const listDistributionRules = async (
  skip = 0,
  limit = 10
): Promise<PaginatedDistributionRules> =>
  doRequest(
    apiInstance.get('/conversation-automatic-distribution/distribution-rule', {
      params: { skip, limit },
    })
  );
