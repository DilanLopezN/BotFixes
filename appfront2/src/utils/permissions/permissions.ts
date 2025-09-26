import { PermissionResources } from '~/constants/permission-resources';
import { UserRoles } from '~/constants/user-roles';
import type { Me } from '~/interfaces/me';
import type { Workspace } from '~/interfaces/workspace';

export const isOwnProfile = (profileUser: Me, user: Me): boolean => {
  return profileUser._id === user._id;
};

export const isSystemAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) => role.role === UserRoles.SYSTEM_ADMIN);
};

export const isSystemDevAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) => role.role === UserRoles.SYSTEM_DEV_ADMIN);
};

export const isSystemCsAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) =>
    [UserRoles.SYSTEM_CS_ADMIN, UserRoles.SYSTEM_ADMIN].includes(role.role)
  );
};

export const isSystemUxAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) =>
    [UserRoles.SYSTEM_UX_ADMIN, UserRoles.SYSTEM_ADMIN].includes(role.role)
  );
};

export const isAnySystemAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) =>
    [UserRoles.SYSTEM_ADMIN, UserRoles.SYSTEM_CS_ADMIN, UserRoles.SYSTEM_UX_ADMIN].includes(
      role.role
    )
  );
};

export const isWorkspaceAdmin = (user: Me, workspaceId: string): boolean =>
  (user.roles || []).some(
    (role) =>
      role.resource === PermissionResources.WORKSPACE &&
      role.role === UserRoles.WORKSPACE_ADMIN &&
      role.resourceId === workspaceId
  );

export const isUserAgent = (user: Me, workspaceId: string): boolean =>
  (user.roles || []).some(
    (role) =>
      role.resource === PermissionResources.WORKSPACE &&
      role.role === UserRoles.WORKSPACE_AGENT &&
      role.resourceId === workspaceId
  );

export const canViewCampaign = (user: Me, workspace: Workspace) => {
  if (isAnySystemAdmin(user) || isWorkspaceAdmin(user, workspace._id)) {
    return true;
  }

  return !!workspace?.generalConfigs?.enableCampaignAllUsers && isUserAgent(user, workspace._id);
};

export const canViewSendingList = (user: Me, workspace: Workspace) => {
  if (isAnySystemAdmin(user) || isWorkspaceAdmin(user, workspace._id)) {
    return true;
  }

  return (
    !!workspace.generalConfigs?.enableAutomaticSendingListAllUsers &&
    isUserAgent(user, workspace._id)
  );
};
