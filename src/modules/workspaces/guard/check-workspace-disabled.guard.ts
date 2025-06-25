import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { User, UserRoles } from '../../users/interfaces/user.interface';
import { WorkspacesService } from '../services/workspaces.service';
import { SKIP_CHECK_WORKSPACE_KEY } from '../../../decorators/skip-check-workspace.decorator';

@Injectable()
export class CheckWorkspaceDisabledGuard implements CanActivate {
    constructor(private readonly moduleRef: ModuleRef, private readonly reflector: Reflector) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const shouldSkip = this.reflector.getAllAndOverride<boolean>(SKIP_CHECK_WORKSPACE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (shouldSkip) return true;

        const request = context.switchToHttp().getRequest();
        const user: User = request.user;

        const isSysAdmin = user?.roles?.find(
            (role) =>
                role.role === UserRoles.SYSTEM_ADMIN ||
                role.role === UserRoles.SYSTEM_CS_ADMIN ||
                role.role === UserRoles.SYSTEM_UX_ADMIN,
        );

        if (isSysAdmin) {
            return true;
        }
        const workspaceId: string = request?.params?.workspaceId || request?.query?.workspaceId;
        if (workspaceId) {
            const workspaceService: WorkspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, {
                strict: false,
            });
            return !(await workspaceService.isWorkspaceDisabled(workspaceId));
        }
        return true;
    }
}
