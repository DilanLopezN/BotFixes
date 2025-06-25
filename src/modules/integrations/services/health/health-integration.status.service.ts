import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HealthIntegrationService } from './health-integration.service';
import { CacheService } from '../../../_core/cache/cache.service';
import {
    HealthIntegration,
    IntegrationEnvironment,
    IntegrationType,
} from '../../interfaces/health/health-integration.interface';
import axios from 'axios';
import * as moment from 'moment';
import { ExternalDataService } from './external-data.service';
import { IntegrationMessageType } from '../../interfaces/health/health-integration-messages.interface';
import { shouldRunCron } from '../../../../common/utils/bootstrapOptions';
import { Redis } from 'ioredis';
import { castObjectIdToString } from '../../../../common/utils/utils';

interface IntegrationStatus {
    name: string;
    online: boolean;
    since: number;
    workspaceId: string;
}

@Injectable()
export class HealthIntegrationStatusService {
    private readonly statusKey = 'STATUS_INTEGRATIONS';

    constructor(
        private readonly integrationService: HealthIntegrationService,
        private readonly cacheService: CacheService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async checkStatusRealTime(integrationId: string) {
        const integration: HealthIntegration = await this.integrationService.getModel().findOne({
            _id: integrationId,
            type: {
                $nin: [IntegrationType.CUSTOM_IMPORT],
            },
            deletedAt: { $eq: null },
        });

        if (!integration) {
            return;
        }

        const client = this.cacheService.getClient();

        let since = +new Date();

        const status: IntegrationStatus = {
            name: integration.name,
            online: false,
            since,
            workspaceId: integration.workspaceId as unknown as string,
        };

        if (integration.enabled) {
            try {
                status.online = await this.integrationService.ping(integration);
            } catch (error) {
                console.log(error);
            }

            client.hset(this.statusKey, {
                [castObjectIdToString(integration._id)]: JSON.stringify(status),
            });
        } else {
            client.hdel(this.statusKey, castObjectIdToString(integration._id));
        }

        return status;
    }

    sendWebHook(previousStatus, newStatus): string {
        try {
            let content = '';

            if (!newStatus.online) {
                content += `Integração **${newStatus.name}** ficou offline \n`;
            } else if (previousStatus) {
                const time = Number(moment.duration(moment().diff(previousStatus.since)).asMinutes().toFixed(0));
                let format = '';

                if (time < 1) {
                    format = `menos de um minuto`;
                } else if (time < 60) {
                    format = `aproximadamente ${time} minuto (s)`;
                } else {
                    format = `${time / 60} horas`;
                }

                content += `Integração **${newStatus.name}** ficou offline por ${format} \n`;
            }

            if (!content) {
                return;
            }

            if (process.env.NODE_ENV !== 'local') {
                const cbUrl =
                    'https://chat.googleapis.com/v1/spaces/AAAAmWhJ21Q/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=gjaf2ghUgRToDK9oypAFO3g3KLxxY1Y_WkiP3pHFa-w';

                axios
                    .post(cbUrl, {
                        text: content,
                    })
                    .then();
            }
            return content;
        } catch (error) {
            console.log(error);
        }
    }

    @Cron('0 */2 * * * *')
    async runStatus() {
        if (!shouldRunCron()) return;
        // rodar apenas em produção a lógica
        if (process.env.NODE_ENV !== 'production') return;

        const integrations = await this.integrationService.getModel().find({
            environment: IntegrationEnvironment.production,
            type: {
                $nin: [IntegrationType.CUSTOM_IMPORT],
            },
            deletedAt: { $eq: null },
        });

        const client = this.cacheService.getClient();

        for (const integration of integrations) {
            try {
                if (integration.enabled) {
                    this.ping(integration, client);
                    await new Promise((r) => setTimeout(r, 150));
                } else {
                    await client.hdel(this.statusKey, castObjectIdToString(integration._id));
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    async ping(integration: HealthIntegration, client: Redis) {
        try {
            let online = false;

            try {
                online = await this.integrationService.ping(integration);
            } catch (error) {
                console.error(error);
                online = false;
            }

            const currentIntegration = await client.hget(this.statusKey, castObjectIdToString(integration._id));
            const parsedCurrentIntegration = JSON.parse(currentIntegration);

            let since = +new Date();
            let previousStatusIsSame = false;

            if (parsedCurrentIntegration && parsedCurrentIntegration.online === online) {
                since = parsedCurrentIntegration.since;
                previousStatusIsSame = true;
            }

            const status: IntegrationStatus = {
                name: integration.name,
                online: online || false,
                since,
                workspaceId: integration.workspaceId as unknown as string,
            };

            await client.hset(this.statusKey, {
                [castObjectIdToString(integration._id)]: JSON.stringify(status),
            });

            if (!previousStatusIsSame) {
                const content = this.sendWebHook(parsedCurrentIntegration, status);
                this.externalDataService
                    .createIntegrationMessage({
                        createdAt: +new Date(),
                        createdByUserId: null,
                        integrationId: castObjectIdToString(integration._id),
                        message: content,
                        type: IntegrationMessageType.system,
                        workspaceId: String(integration.workspaceId),
                    })
                    .then();
            }
        } catch (error) {
            console.error(error);
        }
    }

    async getStatus() {
        try {
            const client = this.cacheService.getClient();
            const result = (await client.hgetall(`${this.statusKey}`)) as any;

            const groupedData: { [workspaceId: string]: IntegrationStatus[] } = {};

            for (const integrationId of Object.keys(result)) {
                const integration = JSON.parse(result[integrationId]);

                if (!groupedData[integration.workspaceId]) {
                    groupedData[integration.workspaceId] = [];
                }

                groupedData[integration.workspaceId].push({
                    ...integration,
                    integrationId,
                });
            }

            return groupedData;
        } catch (error) {
            console.error(error);
        }
    }
}
