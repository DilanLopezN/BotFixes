import { GetUrlWithWorkspaceIdProps } from './interfaces';

export const getUrlWithWorkspaceId = ({ pathname, workspaceId }: GetUrlWithWorkspaceIdProps) => {
  const newPath = pathname.replace(/([a-z\d]+)(\/.*)/, `${workspaceId}$2`);
  return newPath;
};
