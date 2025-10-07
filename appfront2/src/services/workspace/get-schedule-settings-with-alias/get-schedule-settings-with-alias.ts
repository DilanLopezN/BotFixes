import { apiInstance, doRequest } from '~/services/api-instance';
import type { GetScheduleSettingsWithAliasResponse } from './interfaces';

export const getScheduleSettingsWithAlias = async (
  workspaceId: string
): Promise<GetScheduleSettingsWithAliasResponse> => {
  return doRequest(apiInstance.get(`/workspaces/${workspaceId}/schedule-setting-with-alias`));
};
