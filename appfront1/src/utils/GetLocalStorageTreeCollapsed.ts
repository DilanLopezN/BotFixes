import { Constants } from "./Constants";

export const getTreeCollapsedLocal = () => {
    const collapsed = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.TREE_COLLAPSED);
    if (typeof collapsed !== 'string') {
        localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.TREE_COLLAPSED);
        return {};
    }
    const removeLocal = () => localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.TREE_COLLAPSED);

    try {
        const obj = JSON.parse(collapsed);
        if (obj && typeof obj === 'object' && obj !== null) {
            const parsed = JSON.parse(collapsed);
            return parsed;
        }

    } catch (err) {
        removeLocal()
        return {};
    }
}