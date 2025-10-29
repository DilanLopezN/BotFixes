import { Constants } from './Constants';

export const GetFiltersUsersLocal = () => {
    const filterUser = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS_USERS);
    if (typeof filterUser !== 'string') {
        localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS_USERS);
        return {};
    }
    const removeLocal = () => localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS_USERS);

    try {
        const obj = JSON.parse(filterUser);
        if (obj && typeof obj === 'object' && obj !== null) {
            const parsed = JSON.parse(filterUser);
            return parsed;
        }
    } catch (err) {
        removeLocal();
        return {};
    }
};
