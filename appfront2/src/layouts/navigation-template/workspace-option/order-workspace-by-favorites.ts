import type { Workspace } from '~/interfaces/workspace';

export const orderWorkspaceByFavorites = (
  workspaceList: Workspace[],
  recentlyWorkspaceIdList: string[]
) => {
  if (!recentlyWorkspaceIdList.length) return workspaceList;

  let favorites = recentlyWorkspaceIdList;
  const newList = workspaceList;

  if (favorites.length > 5) {
    favorites = favorites.slice(0, 5);
  }

  const changePosition = (arr: Workspace[], from: number, to: number) => {
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
