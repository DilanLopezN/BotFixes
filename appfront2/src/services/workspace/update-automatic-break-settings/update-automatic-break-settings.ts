import type { AutomaticBreakSettings } from '~/interfaces/automatic-break-settings';
import type { NewRequestModel } from '~/interfaces/new-request-model';
import { apiInstance, doRequest } from '~/services/api-instance';

export const updateAutomaticBreakSettings = async (
  workspaceId: string,
  payload: Partial<AutomaticBreakSettings>
): Promise<NewRequestModel<AutomaticBreakSettings>> =>
  doRequest(
    apiInstance.post(`workspaces/${workspaceId}/agentStatus/updateGeneralBreakSetting`, payload)
  );
