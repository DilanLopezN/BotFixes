import { Controller, Get, Param } from '@nestjs/common';
import { HealthIntegrationStatusService } from '../../services/health/health-integration.status.service';

@Controller('workspaces/:workspaceId/integrations')
export class HealthIntegrationStatusController {
    constructor(private readonly healthIntegrationStatusService: HealthIntegrationStatusService) {}

    @Get(':integrationId/status')
    async getIntegrationStatus(@Param('integrationId') integrationId: string) {
        const integrationStatus = await this.healthIntegrationStatusService.checkStatusRealTime(integrationId);

        return integrationStatus;
    }
}
