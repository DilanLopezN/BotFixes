import { SetMetadata } from '@nestjs/common';
import { UserRoles, PermissionResources } from '../interfaces/user.interface';

export enum RoleDataType {
    'BODY' = 'BODY',
    'PARAM' = 'PARAM',
    'NONE' = 'NONE',
}

export interface RoleData {
    role: UserRoles;
    resource: PermissionResources;
    idLocation: RoleDataType;
    resourceIdName: string;
}
export const RolesDecorator = (rolesData: RoleData[]) => SetMetadata('roles', rolesData);
