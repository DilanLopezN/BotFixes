import { ApiError } from '../../../../interfaces/api-error.interface';
import { SmartReengagementSetting } from '../../service/fetch-smart-reengagement-setting-by-id/interfaces';

export interface UseFetchSmartReengagementSettingResult {
    data: SmartReengagementSetting | undefined;
    isLoading: boolean;
    error: ApiError | undefined;
}
