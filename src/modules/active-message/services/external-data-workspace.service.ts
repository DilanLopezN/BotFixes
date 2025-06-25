import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';

/**
*  Este módulo foi criado para encapsular apenas o WorkspacesService e expô-lo de forma isolada,
   evitando a importação de todas as dependências do ExternalDataService original.
   Isso resolve problemas de injeção no ActiveMessageModule e SendMessageService, 
   causados por dependências indiretas não resolvidas e ordem de inicialização dos serviços.
 */

@Injectable()
export class ExternalDataWorkspaceService {
    private workspacesService: WorkspacesService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
    }

    async isWorkspaceRatingEnabled(workspaceId: string) {
        const result = await this.workspacesService.isWorkspaceRatingEnabled(workspaceId);
        return result;
    }

    async isWorkspaceDisabled(workspaceId: string) {
        return await this.workspacesService.isWorkspaceDisabled(workspaceId);
    }
}
