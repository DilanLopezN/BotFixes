import { LOCAL_STORAGE_KEYS } from '~/constants/local-storage-keys';

export const getRecentlyWorkspaces = () => {
  const recently = localStorage.getItem(LOCAL_STORAGE_KEYS.RECENTLY_WORKSPACES);
  if (typeof recently !== 'string') {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.RECENTLY_WORKSPACES);
    return [];
  }
  const removeLocal = () => localStorage.removeItem(LOCAL_STORAGE_KEYS.RECENTLY_WORKSPACES);

  try {
    const obj = JSON.parse(recently);
    if (obj && typeof obj === 'object' && obj !== null) {
      const parsed = JSON.parse(recently);
      return parsed.items.reverse();
    }
    return [];
  } catch (err) {
    removeLocal();
    return [];
  }
};
