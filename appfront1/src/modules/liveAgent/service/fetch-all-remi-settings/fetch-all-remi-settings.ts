import { apiInstance } from '../../../../utils/Http';
import { SmartReengagementSettingsResponse } from '../../hooks/use-all-remi-settings/interfaces';

export const fetchAllRemiSettings = async (workspaceId: string): Promise<SmartReengagementSettingsResponse> =>
    await apiInstance.get(`/workspaces/${workspaceId}/smt-re-settings`);
