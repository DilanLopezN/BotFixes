import store from '../redux/store';
import { User, PermissionResources, UserRoles, Role } from 'kissbot-core';
import { WorkspaceUserService } from '../modules/settings/service/WorkspaceUserService';
import { FeatureFlag, Workspace } from '../model/Workspace';

export interface PermissionData {
    role: UserRoles;
    resource: PermissionResources;
    resourceId?: string;
}

export class UserPermission {
    static can(permissionDataList: Array<PermissionData>): boolean {
        const state: any = store.getState();
        const user: User = state.loginReducer.loggedUser;
        if (!user.roles) {
            return false;
        }
        for (let i = 0; i < permissionDataList.length; i++) {
            const permissionData = permissionDataList[i];
            const canPerformAction = !!user.roles.find((role) => {
                if (role.role == UserRoles.SYSTEM_ADMIN) {
                    return true;
                }
                if (
                    (role.resource == permissionData.resource &&
                        role.resourceId == permissionData.resourceId &&
                        role.role == permissionData.role) ||
                    (role.resource == permissionData.resource && role.role == permissionData.role)
                ) {
                    return true;
                }
                return false;
            });
            if (canPerformAction) return true;
        }

        return false;
    }
}

export class FeatureFlagPermission {
    static can(permissionData: keyof FeatureFlag): boolean {
        const state: any = store.getState();
        const selectedWorkspace: Workspace = state.workspaceReducer.selectedWorkspace;

        if (!selectedWorkspace) return true;

        return !!selectedWorkspace?.featureFlag?.[permissionData];
    }
}

export class canViewCampaign {
    static can(): boolean {
        const state: any = store.getState();
        const selectedWorkspace: Workspace = state.workspaceReducer.selectedWorkspace;
        const user: User = state.loginReducer.loggedUser;

        if (!selectedWorkspace || !user) return true;

        if (isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace._id)) {
            return true;
        }

        return !!selectedWorkspace?.generalConfigs?.enableCampaignAllUsers && isUserAgent(user, selectedWorkspace._id);
    }
}

export class canViewSendingList {
    static can(): boolean {
        const state: any = store.getState();
        const selectedWorkspace: Workspace = state.workspaceReducer.selectedWorkspace;
        const user: User = state.loginReducer.loggedUser;

        if (!selectedWorkspace || !user) return true;

        if (isAnySystemAdmin(user) || isWorkspaceAdmin(user, selectedWorkspace._id)) {
            return true;
        }

        return (
            !!selectedWorkspace?.generalConfigs?.enableAutomaticSendingListAllUsers &&
            isUserAgent(user, selectedWorkspace._id)
        );
    }
}

export const getWorkspaceRoles = (user: User, workspaceId: string): Role[] => {
    if(!user) return [];

    return (user.roles || []).filter((role) => {
        return role.resource === PermissionResources.WORKSPACE && role.resourceId === workspaceId;
    });
};

export const hasRoleInWorkspace = (user: User, role: UserRoles, workspaceId: string): boolean => {
    return getWorkspaceRoles(user, workspaceId).reduce<boolean>((result, currentRole) => {
        if (result) {
            return result;
        }

        return currentRole.role === role;
    }, false);
};

export const isOwnProfile = (profileUser: User, user: User): boolean => {
    return profileUser._id === user._id;
};

export const isSystemAdmin = (user: User): boolean => {
    return user && (user.roles || []).some((role) => role.role === UserRoles.SYSTEM_ADMIN);
};

export const isSystemDevAdmin = (user: User): boolean => {
    return user && (user.roles || []).some((role) => role.role === UserRoles.SYSTEM_DEV_ADMIN);
};

export const isSystemFarmerAdmin = (user: User): boolean => {
    return user && (user.roles || []).some((role) => role.role === UserRoles.SYSTEM_FARMER_ADMIN);
};

export const isSystemCsAdmin = (user: User): boolean => {
    return user && (user.roles || []).some((role) => [UserRoles.SYSTEM_CS_ADMIN, UserRoles.SYSTEM_ADMIN].includes(role.role));
};

export const isSystemUxAdmin = (user: User): boolean => {
    return user && (user.roles || []).some((role) => [UserRoles.SYSTEM_UX_ADMIN, UserRoles.SYSTEM_ADMIN].includes(role.role));
};

export const isAnySystemAdmin = (user: User): boolean => {
    return (
        user &&
        (user.roles || []).some((role) =>
            [
                UserRoles.SYSTEM_ADMIN,
                UserRoles.SYSTEM_CS_ADMIN,
                UserRoles.SYSTEM_UX_ADMIN,
                UserRoles.SYSTEM_DEV_ADMIN,
            ].includes(role.role)
        )
    );
};

export const isWorkspaceAdmin = (user: User, workspaceId: string): boolean =>
    user && (user.roles || []).some(
        (role) =>
            role.resource === PermissionResources.WORKSPACE &&
            role.role === UserRoles.WORKSPACE_ADMIN &&
            role.resourceId === workspaceId
    );

export const isUserAgent = (user: User, workspaceId: string): boolean =>
    user && (user.roles || []).some(
        (role) =>
            role.resource === PermissionResources.WORKSPACE &&
            role.role === UserRoles.WORKSPACE_AGENT &&
            role.resourceId === workspaceId
    );

export const removeUserWorkspaceRolesDiffFrom = async (
    user: User,
    role: UserRoles,
    workspaceId: string
): Promise<void> => {
    for (const currentRole of getWorkspaceRoles(user, workspaceId)) {
        if (currentRole.role !== role) {
            await WorkspaceUserService.deleteRole(workspaceId, user._id as string, currentRole._id as string, () => {
                console.error(`Error on removing user role [${role}]`);
            });
        }
    }
};

export const removeUserWorkspaceRoles = async (user: User | any, workspaceId: string): Promise<void> => {
    for (const currentRole of getWorkspaceRoles(user, workspaceId)) {
        await WorkspaceUserService.deleteRole(workspaceId, user._id as string, currentRole._id as string, () => {
            console.error(`Error on removing user role [${currentRole}]`);
        });
    }
};

export const redirectAfterLoginPath = (loggedUser: User): string => {
    const userIsSystemAdmin = isSystemAdmin(loggedUser);
    if (userIsSystemAdmin) {
        return '/home';
    }

    const activeWorkspaceRoles = [UserRoles.WORKSPACE_ADMIN, UserRoles.WORKSPACE_AGENT];
    let activeWorkspacesLength = loggedUser.roles?.map((role) => activeWorkspaceRoles.includes(role.role)).length ?? 0;

    if (activeWorkspacesLength === 1) {
        return '/live-agent';
    }
    return '/home';
};
