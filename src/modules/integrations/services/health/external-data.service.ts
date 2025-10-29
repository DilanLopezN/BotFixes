import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HealthIntegrationStatusService } from '../../../integrations/services/health/health-integration.status.service';
import { HealthEntityService } from './health-entity.service';
import { HealthIntegration } from '../../interfaces/health/health-integration.interface';
import { HealthIntegrationMessagesService } from './health-integration-messages.service';
import { CreateIntegrationMessage } from '../../interfaces/health/health-integration-messages.interface';
import { WorkspacesService } from '../../../workspaces/services/workspaces.service';
import { RunnerService } from '../../../runner-manager/services/runner.service';

@Injectable()
export class ExternalDataService {
    private _healthIntegrationStatusService: HealthIntegrationStatusService;
    private _healthIntegrationMessagesService: HealthIntegrationMessagesService;
    private _healthEntityService: HealthEntityService;
    private _workspacesService: WorkspacesService;
    private _runnerService: RunnerService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get healthIntegrationStatusService(): HealthIntegrationStatusService {
        if (!this._healthIntegrationStatusService) {
            this._healthIntegrationStatusService = this.moduleRef.get<HealthIntegrationStatusService>(
                HealthIntegrationStatusService,
                { strict: false },
            );
        }
        return this._healthIntegrationStatusService;
    }

    private get healthIntegrationMessagesService(): HealthIntegrationMessagesService {
        if (!this._healthIntegrationMessagesService) {
            this._healthIntegrationMessagesService = this.moduleRef.get<HealthIntegrationMessagesService>(
                HealthIntegrationMessagesService,
                { strict: false },
            );
        }
        return this._healthIntegrationMessagesService;
    }

    private get healthEntityService(): HealthEntityService {
        if (!this._healthEntityService) {
            this._healthEntityService = this.moduleRef.get<HealthEntityService>(HealthEntityService, {
                strict: false,
            });
        }
        return this._healthEntityService;
    }

    private get workspacesService(): WorkspacesService {
        if (!this._workspacesService) {
            this._workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, {
                strict: false,
            });
        }
        return this._workspacesService;
    }

    private get runnerService(): RunnerService {
        if (!this._runnerService) {
            this._runnerService = this.moduleRef.get<RunnerService>(RunnerService, {
                strict: false,
            });
        }
        return this._runnerService;
    }

    async appendIntegrationStatus(integrations: any[], workspaceId: string) {
        const groupedData: any = await this.healthIntegrationStatusService.getStatus();

        return integrations.map((integration) => {
            const integrationStatus = (groupedData[workspaceId] ?? [])?.find(
                (status) => (status.integrationId || '') === integration._id?.toHexString?.(),
            );

            return {
                ...integration?.toJSON(),
                integrationStatus: integrationStatus || null,
            };
        });
    }

    async appendIntegrationMessages(integrations: any[], workspaceId: string) {
        try {
            const groupedData: any = await this.healthIntegrationMessagesService.listIntegrationMessagesByWorkspaceId(
                workspaceId,
            );

            return integrations.map((integration) => {
                const integrationMessagesData = groupedData?.[integration._id] ?? {};

                return {
                    ...integration,
                    ...integrationMessagesData,
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getPendingPublicationEntitiesByIntegrationId(workspaceId: string, integration: HealthIntegration) {
        return await this.healthEntityService.getPendingPublicationEntitiesByIntegrationId(workspaceId, integration);
    }

    async createIntegrationMessage(message: CreateIntegrationMessage) {
        return await this.healthIntegrationMessagesService.createIntegrationMessage(message);
    }

    async getIntegrationStatus(workspaceId: string) {
        try {
            const data = await this.healthIntegrationStatusService.getStatus();
            return data?.[workspaceId];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getWorkspace(workspaceId: string) {
        return await this.workspacesService.getOne(workspaceId);
    }

    async doSql(integrationId, sql: string): Promise<any> {
        return await this.runnerService.doSqlByIntegration(integrationId, sql);
    }
}
