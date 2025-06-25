import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User, UserRoles } from '../interfaces/user.interface';
import { Reflector } from '@nestjs/core';
import { RoleData, RoleDataType } from '../decorators/roles.decorator';
import { isAnySystemAdmin, isSystemDevAdmin, isSystemFarmerAdmin } from '../../../common/utils/roles';
import { isSystemUxAdmin } from '../../../common/utils/roles';
import { isSystemCsAdmin } from '../../../common/utils/roles';
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(readonly reflector: Reflector) {}
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const rolesData: Array<RoleData> = this.reflector.get<Array<RoleData>>('roles', context.getHandler());
        const request: any = context.switchToHttp().getRequest();
        const user: User = request.user;
        const isSysAdmin = user.roles.find((role) => role.role === UserRoles.SYSTEM_ADMIN);

        if (isSysAdmin) {
            return true;
        }

        for (let i = 0; i < rolesData.length; i++) {
            const roleData = rolesData[i];
            let paramId: string | any;
            if (roleData.idLocation == RoleDataType.BODY) {
                paramId = request.body[roleData.resourceIdName];
            } else if (roleData.idLocation == RoleDataType.PARAM) {
                paramId = request.params[roleData.resourceIdName];
            }
            const canPerformAction = !!user.roles.find((role) => {
                if (
                    isSystemUxAdmin(user) ||
                    isSystemCsAdmin(user) ||
                    isSystemDevAdmin(user) ||
                    isSystemFarmerAdmin(user)
                ) {
                    if (roleData.role == role.role) {
                        return true;
                    }
                }
                if (!isAnySystemAdmin(user)) {
                    if (roleData.idLocation == RoleDataType.NONE && role.resource == roleData.resource) {
                        return true;
                    }
                }
                if (role.resource == roleData.resource && role.resourceId == paramId) {
                    return role.role == roleData.role;
                }
                return false;
            });
            if (canPerformAction) return true;
        }
        return false;
    }
}
