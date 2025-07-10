import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ServiceStatusService } from './service-status.service';
import { ServiceRunnerService } from './service-runner.service';
import { RunnerService } from './runner.service';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';

@Injectable()
export class RunnerManagerStatusService {
    private readonly logger = new Logger(RunnerManagerStatusService.name);
    constructor(
        private readonly serviceStatusService: ServiceStatusService,
        private readonly serviceRunnerService: ServiceRunnerService,
        private readonly runnerService: RunnerService,
    ) {}

    // @Cron(CronExpression.EVERY_MINUTE)
    @Cron(CronExpression.EVERY_5_MINUTES)
    private async createRunnerStatusAndServiceStatus() {
        if (!shouldRunCron()) return;

        const services = await this.serviceRunnerService.getAll();

        for (const service of services) {
            try {
                const pingResult = await this.runnerService.integratorPing(service.runner.id, service.id);
                if (pingResult) {
                    await this.serviceStatusService.createServiceStatus({
                        env: service.env,
                        integrationId: service.integrationId,
                        runnerId: String(service.runner.id),
                        workspaceId: service.workspaceId,
                        ok: pingResult.ok,
                        version: pingResult.version,
                    });
                }
            } catch (e) {
                this.logger.log('createRunnerStatusAndServiceStatus' + e?.message);
            }
        }
    }
}
