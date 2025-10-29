import { PermissionResource } from '~/constants/permission-resources';
import { UserRole } from '~/constants/user-roles';
import type { Me } from '~/interfaces/me';
import type { UserPermission } from '~/interfaces/user-permission';
import type { Workspace } from '~/interfaces/workspace';

export const isOwnProfile = (profileUser: Me, user: Me): boolean => {
  return profileUser._id === user._id;
};

export const hasRole = (roles: UserPermission[], user: Me) => {
  return user.roles.some((userRole) =>
    roles.some((role) => userRole.resource === role.resource && userRole.role === role.role)
  );
};

export const isSystemAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) => role.role === UserRole.SYSTEM_ADMIN);
};

export const isSystemDevAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) => role.role === UserRole.SYSTEM_DEV_ADMIN);
};

export const isSystemSupportAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) => role.role === UserRole.SYSTEM_SUPPORT_ADMIN);
};

export const isSystemCsAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) =>
    [UserRole.SYSTEM_CS_ADMIN, UserRole.SYSTEM_ADMIN].includes(role.role)
  );
};

export const isSystemUxAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) =>
    [UserRole.SYSTEM_UX_ADMIN, UserRole.SYSTEM_ADMIN].includes(role.role)
  );
};

export const isAnySystemAdmin = (user: Me): boolean => {
  return (user.roles || []).some((role) =>
    [
      UserRole.SYSTEM_ADMIN,
      UserRole.SYSTEM_CS_ADMIN,
      UserRole.SYSTEM_UX_ADMIN,
      UserRole.SYSTEM_DEV_ADMIN,
    ].includes(role.role)
  );
};

export const isWorkspaceAdmin = (user: Me, workspaceId: string): boolean =>
  (user.roles || []).some(
    (role) =>
      role.resource === PermissionResource.WORKSPACE &&
      role.role === UserRole.WORKSPACE_ADMIN &&
      role.resourceId === workspaceId
  );

export const isUserAgent = (user: Me, workspaceId: string): boolean =>
  (user.roles || []).some(
    (role) =>
      role.resource === PermissionResource.WORKSPACE &&
      role.role === UserRole.WORKSPACE_AGENT &&
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
