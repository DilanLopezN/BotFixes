import type { CancelingReasonMetric } from '~/interfaces/canceling-reason-metric';
import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetCancelingReasonMetricsProps } from './interfaces';

export const getCancelingReasonMetrics = async ({
  workspaceId,
  ...apiProps
}: GetCancelingReasonMetricsProps): Promise<CancelingReasonMetric[]> => {
  return doRequest(
    apiInstance.post(
      `/workspaces/${workspaceId}/schedule-analytics/metrics-cancel-reason`,
      apiProps
    )
  );
};
