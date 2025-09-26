import { Constants } from '../../../../utils/Constants';

export const onBeforeUnload = (e) => {
    let localMessages = {};
    const recentlyItems = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES);

    if (recentlyItems && typeof recentlyItems === 'string') {
        try {
            localMessages = JSON.parse(recentlyItems);
        } catch (error) {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_SAVED_MESSAGES);
        }
    }

    if (Object.keys(localMessages).length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return;
    }

    return undefined;
};
