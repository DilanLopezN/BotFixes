import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Exceptions } from '../../auth/exceptions';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';

@Injectable()
export class AgentStatusFeatureFlagGuard implements CanActivate {
    private workspaceService: WorkspacesService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { workspaceId } = request.params;

        this.workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });

        const workspace = await this.workspaceService.getOne(workspaceId);
        if (!workspace.advancedModuleFeatures?.enableAgentStatus) {
            throw Exceptions.AGENT_STATUS_FEATURE_FLAG_NOT_ENABLED;
        }

        return true;
    }
}
