import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HealthIntegrationStatusService } from '../../../integrations/services/health/health-integration.status.service';
import { HealthEntityService } from './health-entity.service';
import { HealthIntegration } from '../../interfaces/health/health-integration.interface';
import { HealthIntegrationMessagesService } from './health-integration-messages.service';
import { CreateIntegrationMessage } from '../../interfaces/health/health-integration-messages.interface';

@Injectable()
export class ExternalDataService {
    private healthIntegrationStatusService: HealthIntegrationStatusService;
    private healthIntegrationMessagesService: HealthIntegrationMessagesService;
    private healthEntityService: HealthEntityService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.healthIntegrationStatusService = this.moduleRef.get<HealthIntegrationStatusService>(
            HealthIntegrationStatusService,
            { strict: false },
        );
        this.healthEntityService = this.moduleRef.get<HealthEntityService>(HealthEntityService, {
            strict: false,
        });
        this.healthIntegrationMessagesService = this.moduleRef.get<HealthIntegrationMessagesService>(
            HealthIntegrationMessagesService,
            {
                strict: false,
            },
        );
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
}
