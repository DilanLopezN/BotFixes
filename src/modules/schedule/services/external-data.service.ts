import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';

@Injectable()
export class ExternalDataService {
    private workspacesService: WorkspacesService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
    }

    async isWorkspaceDisabled(workspaceId: string) {
        return await this.workspacesService.isWorkspaceDisabled(workspaceId);
    }
}
