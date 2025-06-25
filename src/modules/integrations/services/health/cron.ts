import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntegrationType } from '../../interfaces/health/health-integration.interface';
import { HealthEntityService } from './health-entity.service';
import { HealthIntegrationService } from './health-integration.service';
import { shouldRunCron } from '../../../../common/utils/bootstrapOptions';
import { castObjectIdToString } from '../../../../common/utils/utils';

@Injectable()
export class TasksService {
    constructor(
        private readonly healthIntegrationService: HealthIntegrationService,
        private readonly healthEntityService: HealthEntityService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async syncIntegrationEntities(): Promise<void> {
        if (!shouldRunCron()) return;
        // Rodar local gera spam
        if (process.env.NODE_ENV !== 'production') return;

        const integrations = await this.healthIntegrationService.getModel().find({
            $or: [{ enabled: true }, { enabled: { $exists: false } }],
            type: { $nin: [IntegrationType.CUSTOM_IMPORT] },
            deletedAt: { $exists: false },
        });

        for (const integration of integrations) {
            try {
                await this.healthEntityService.extractAllHealthEntitities(
                    castObjectIdToString(integration._id),
                    castObjectIdToString(integration.workspaceId),
                );
            } catch (error) {
                console.error('TasksService.syncIntegrationEntities', error);
            }
        }
    }
}
