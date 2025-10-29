import { UserRoles } from 'kissbot-core';
import { Document } from 'mongoose';
import { UserLanguage } from '../dtos/user.dto';
import { LoginMethod } from '../schemas/user.schema';

export enum PermissionResources {
    'WORKSPACE' = 'WORKSPACE',
    'BOT' = 'BOT',
    'ENTITY' = 'ENTITY',
    'USER' = 'USER',
    'ORGANIZATION' = 'ORGANIZATION',
    'CHANNEL_CONFIG' = 'CHANNEL_CONFIG',
    'ANY' = 'ANY',
}

export { UserRoles };

export interface Role extends Document {
    resource: PermissionResources;
    resourceId?: string;
    role: UserRoles;
}

export interface User extends Document {
    name: string;
    email: string;
    password: string;
    loginMethod?: LoginMethod;
    cognitoUniqueId: string;
    timezone?: string;
    avatar?: string;
    language: UserLanguage;
    roles: Role[];
    liveAgentParams?: LiveAgentParams;
    passwordExpires: number;
    isVerified: boolean;
    erpUsername?: string;
}

export interface LiveAgentParams {
    notifications?: {
        emitSoundNotifications?: boolean;
        notificationNewAttendance?: boolean;
    };
}

export interface CreateSSOUserData {
    name: string;
    email: string;
    avatar: string;
    cognitoUniqueId: string;
}
