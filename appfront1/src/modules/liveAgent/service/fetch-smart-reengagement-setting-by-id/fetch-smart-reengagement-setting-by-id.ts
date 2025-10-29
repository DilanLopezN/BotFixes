import { apiInstance } from '../../../../utils/Http';
import { SmartReengagementSetting } from './interfaces';

export const fetchSmartReengagementSettingById = async (
    workspaceId: string,
    smtReSettingId: string
): Promise<SmartReengagementSetting> => {
    const response = await apiInstance.get(`workspaces/${workspaceId}/smt-re/${smtReSettingId}`);
    return response.data;
};
