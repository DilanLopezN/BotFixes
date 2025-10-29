import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CatchError } from '../../auth/exceptions';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { EventsService } from '../../events/events.service';
import { KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';

@Injectable()
export class SetupDefaultFeaturesService {
    private workspaceService: WorkspacesService;
    private eventsService: EventsService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onModuleInit() {
        this.workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        this.eventsService = this.moduleRef.get<EventsService>(EventsService, { strict: false });
    }

    /**
     * Configura as features padrão do workspace durante o setup inicial
     * - Cria dashboards templates padrão
     */
    @CatchError()
    async setupDefaultFeatures(workspaceId: string): Promise<void> {
        try {
            await this.workspaceService.updateFlagsAndConfigs(workspaceId, {
                featureFlag: {
                    dashboardNewVersion: true,
                },
            });
        } catch (error) {
            console.error(`[SetupDefaultFeatures] Erro ao configurar features padrão: ${error.message}`, error);
            // Não lancei erro para não quebrar o setup inicial
        }
    }

    private async dispatchWorkspaceUpdatedEvent(workspace: any): Promise<void> {
        try {
            const eventPayload = {
                data: {
                    _id: workspace._id,
                    name: workspace.name,
                    featureFlag: workspace.featureFlag,
                    generalConfigs: workspace.generalConfigs,
                    updatedAt: new Date(),
                },
                dataType: KissbotEventDataType.WORKSPACE,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.WORKSPACE_UPDATED,
            };

            await this.eventsService.sendEvent(eventPayload);
        } catch (error) {
            console.error(`[SetupDefaultFeatures] Erro ao disparar evento WORKSPACE_UPDATED: ${error.message}`);
        }
    }
}
