import { Constants } from "./Constants";


export const getRecentlyWorkspacesLocal = () => {
    const recently = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_WORKSPACES);
    if (typeof recently !== 'string') {
        localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_WORKSPACES);
        return [];
    }
    const removeLocal = () => localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.RECENTLY_WORKSPACES);

    try {
        const obj = JSON.parse(recently);
        if (obj && typeof obj === 'object' && obj !== null) {
            const parsed = JSON.parse(recently);
            return parsed.items.reverse();
        }
    } catch (err) {
        removeLocal();
        return [];
    }
};

export const list = (workspaceList, recentlyWorkspaces) => {
    if (!recentlyWorkspaces.length) return workspaceList;

    let favorites = recentlyWorkspaces;
    let newList = workspaceList;

    if (favorites.length > 3) {
        favorites = favorites.slice(0, 3);
    }

    const changePosition = (arr, from, to) => {
        arr.splice(to, 0, arr.splice(from, 1)[0]);
        return arr;
    };

    favorites.forEach((id, index) => {
        const favoriteWorkspace = newList.findIndex((w) => w._id === id);
        if (favoriteWorkspace !== -1) {
            changePosition(newList, favoriteWorkspace, index);
        }
    });

    return newList;
};