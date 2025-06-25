import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { CatchError } from "../../auth/exceptions";
import { WorkspacesService } from "../../workspaces/services/workspaces.service";

@Injectable()
export class SetupWorkspaceService {
    constructor (
        private readonly moduleRef: ModuleRef,
    ){}

    @CatchError()
    async createWorkspace(workspaceName: string) {
        const workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, {strict: false});
        const workspace = await workspaceService._create({
            name: workspaceName,
        })
        return workspace?.toJSON?.();
    }
}