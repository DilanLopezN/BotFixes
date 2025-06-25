import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Exceptions } from '../../auth/exceptions';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { isUserAgent } from '../../../common/utils/roles';

@Injectable()
export class AutomaticSendingListFeatureFlagGuard implements CanActivate {
    private workspaceService: WorkspacesService;
    constructor(readonly reflector: Reflector, private moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const { workspaceId } = request.params;
        const user = request.user;

        const workspace = await this.workspaceService.getOne(workspaceId);
        if (!workspace.featureFlag?.enableConfirmation) {
            throw Exceptions.CONFIRMATION_FEATURE_FLAG_NOT_ENABLED;
        }

        const isAgent = isUserAgent(user, workspaceId);
        if (
            workspace.featureFlag.enableConfirmation &&
            !workspace?.generalConfigs?.enableAutomaticSendingListAllUsers &&
            isAgent
        ) {
            throw Exceptions.CONFIRMATION_FEATURE_FLAG_NOT_ENABLED;
        }

        return true;
    }
}
