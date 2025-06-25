import { PermissionResources, UserRoles } from 'kissbot-core';
import { User } from '../../modules/users/interfaces/user.interface';

export const getAdminRoles = () => [
    UserRoles.SYSTEM_ADMIN,
    UserRoles.SYSTEM_UX_ADMIN,
    UserRoles.SYSTEM_CS_ADMIN,
    UserRoles.SYSTEM_DEV_ADMIN,
];

export const isSystemAdmin = (user: User): boolean => {
    return (user.roles || []).some((role) => role.role === UserRoles.SYSTEM_ADMIN);
};

export const isAnySystemAdmin = (user: User): boolean => {
    return (user.roles || []).some((role) =>
        [
            UserRoles.SYSTEM_ADMIN,
            UserRoles.SYSTEM_UX_ADMIN,
            UserRoles.SYSTEM_CS_ADMIN,
            UserRoles.SYSTEM_DEV_ADMIN,
        ].includes(role.role),
    );
};

export const isSystemDevAdmin = (user: User): boolean => {
    return (user.roles || []).some((role) => [UserRoles.SYSTEM_ADMIN, UserRoles.SYSTEM_DEV_ADMIN].includes(role.role));
};

export const isSystemFarmerAdmin = (user: User): boolean => {
    return (user.roles || []).some((role) =>
        [UserRoles.SYSTEM_ADMIN, UserRoles.SYSTEM_FARMER_ADMIN].includes(role.role),
    );
};

export const isSystemUxAdmin = (user: User): boolean => {
    return (user.roles || []).some((role) => [UserRoles.SYSTEM_ADMIN, UserRoles.SYSTEM_UX_ADMIN].includes(role.role));
};

export const isSystemCsAdmin = (user: User): boolean => {
    return (user.roles || []).some((role) => [UserRoles.SYSTEM_ADMIN, UserRoles.SYSTEM_CS_ADMIN].includes(role.role));
};

export const isWorkspaceAdmin = (user: User, workspaceId: string): boolean =>
    (user.roles || []).some(
        (role) =>
            role.resource === PermissionResources.WORKSPACE &&
            role.role === UserRoles.WORKSPACE_ADMIN &&
            role.resourceId == workspaceId,
    );

export const isUserAgent = (user: User, workspaceId: string): boolean =>
    (user.roles || []).some(
        (role) =>
            role.resource === PermissionResources.WORKSPACE &&
            role.role === UserRoles.WORKSPACE_AGENT &&
            role.resourceId == workspaceId,
    );

export const isAnyWorkspaceAdmin = (user: User): boolean =>
    (user.roles || []).some(
        (role) => role.resource === PermissionResources.WORKSPACE && role.role === UserRoles.WORKSPACE_ADMIN,
    );

export const getAdminWorkspaceId = (user: User): string | undefined => {
    const adminRole = (user.roles || []).find(
        (role) => role.resource === PermissionResources.WORKSPACE && role.role === UserRoles.WORKSPACE_ADMIN,
    );
    return adminRole?.resourceId;
};
