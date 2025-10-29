import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';

@Injectable()
export class ExternalDataService {
    private _workspacesService: WorkspacesService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get workspacesService(): WorkspacesService {
        if (!this._workspacesService) {
            this._workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        }
        return this._workspacesService;
    }

    async isWorkspaceDisabled(workspaceId: string) {
        return await this.workspacesService.isWorkspaceDisabled(workspaceId);
    }
}
