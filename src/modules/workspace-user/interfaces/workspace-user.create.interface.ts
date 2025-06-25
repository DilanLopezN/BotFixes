import { PermissionResources } from "kissbot-core";
import { UserRoles } from "../../users/interfaces/user.interface";

export interface User{
    name: string;
    email: string;
    cognitoUniqueId?: string;
    password: string;
    rememberPasswordToken?: string;
    rememberPasswordTokenExpiration?: Date;
    role?: Role;
    language?: UserLanguage;
    liveAgentParams?: LiveAgentParams;
    passwordExpires?: number;
    avatar?: string;
    timezone?: string;
}

export interface Role{
    resource: PermissionResources;
    resourceId: string;
    role: UserRoles;
}

export declare enum UserLanguage {
    pt = "pt",
    en = "en",
    es = "es"
}

export interface LiveAgentParams {
    notifications?: {
        emitSoundNotifications?: boolean;
        notificationNewAttendance?: boolean;
    };
}

export enum SubRolesResourceWorkspace {
    DASHBOARD_ADMIN = UserRoles.DASHBOARD_ADMIN,
}
