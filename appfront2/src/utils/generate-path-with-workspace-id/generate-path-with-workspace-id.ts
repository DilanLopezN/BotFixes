import { generatePath } from 'react-router-dom';
import { getWorkspaceIdFromUrl } from '../get-workpace-id-from-url';

export const generatePathWithWorkspaceId = (originalPath: string) => {
  const workspaceId = getWorkspaceIdFromUrl();
  const path = generatePath(originalPath, { workspaceId });

  return path;
};
