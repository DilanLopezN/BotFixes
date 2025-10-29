import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { UpdateWorkspaceFlagsDto } from '../../workspaces/dtos/workspace.dto';

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

    //adicionei aqui porque tive problema de dependencia circular usando o external-data.service
    async updateWorkspaceFlagsAndConfigs(workspaceId: string, dto: UpdateWorkspaceFlagsDto, internalRequest: boolean) {
        try {
            const result = await this.workspacesService.updateFlagsAndConfigs(workspaceId, dto, null, internalRequest);
            return result;
        } catch (error) {
            throw error;
        }
    }
}
