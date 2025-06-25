import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { CacheService } from '../../_core/cache/cache.service';
import { CustomerXMetrics, SendTracking, TrackingType } from '../interfaces/send-tracking.interface';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalDataService } from './external-data.service';
import { IBillingCreatedPaymentEvent } from 'kissbot-core';
import { PaymentItemTypes } from '../../billing/models/payment-item.entity';
import * as Sentry from '@sentry/node';

@Injectable()
export class CustomerXService {
    private customerXApi: AxiosInstance;
    private credential: string = process.env.CUSTOMER_X_CREDENTIAL;
    private key: string = process.env.CUSTOMER_X_KEY;
    constructor(public cacheService: CacheService, private readonly externalDataService: ExternalDataService) {
        this.customerXApi = axios.create({
            baseURL: 'https://tracker.customerx.com.br',
            headers: {
                key: this.key,
                credential: this.credential,
            },
        });
    }

    getMetricQueueAwaitingAttendanceCacheKey(workspaceId: string) {
        // Metrica quantidade de pessoas aguardando atendimento
        return `METRIC_CUSTOMER_AWAITING_ATTENDANCE:${workspaceId}`;
    }

    getMetricLowRatingsCacheKey(workspaceId: string) {
        // Metrica quantidade de avaliações baixas (menor que 4)
        return `METRIC_CUSTOMER_LOW_RATINGS:${workspaceId}`;
    }

    async setMetricQueueAwaitingAttendance(workspaceId: string, teamId: string, typeIcr: 'increase' | 'decrease') {
        if (!workspaceId || !teamId) return;

        const client = this.cacheService.getClient();
        const key = this.getMetricQueueAwaitingAttendanceCacheKey(workspaceId);
        if (typeIcr === 'increase') {
            await client.hincrby(key, teamId, 1);
        } else {
            await client.hincrby(key, teamId, -1);
        }
    }

    async setMetricLowRatings(workspaceId: string, teamId: string, ratingValue: number) {
        if (!workspaceId || !teamId) return;

        const client = this.cacheService.getClient();
        const key = this.getMetricLowRatingsCacheKey(workspaceId);
        if (ratingValue <= 4) {
            await client.hincrby(key, teamId, 1);
        }
    }

    private metricsCustomerX: {
        name: string;
        key?: (workspaceId: string) => string;
    }[] = [
        { name: CustomerXMetrics.QTD_aguardando_atendimento, key: this.getMetricQueueAwaitingAttendanceCacheKey },
        { name: CustomerXMetrics.QTD_avaliações_baixas, key: this.getMetricLowRatingsCacheKey },
        { name: CustomerXMetrics.QTD_espera_maior_uma_hora }, // atendimentos em espera a mais de uma hora nos ultimos 60 dias agrupados por time
    ];

    // Define o cron job para rodar de segunda a sexta-feira, as 11h e as 16h
    @Cron('0 6 * * 1-5')
    // @Cron(CronExpression.EVERY_10_SECONDS)
    async consumeMetrics() {
        if (!shouldRunCron()) return;

        try {
            const workspaces = await this.externalDataService.getWorkspaces();

            if (workspaces && workspaces?.length) {
                const client = this.cacheService.getClient();
                for (const workspace of workspaces) {
                    if (workspace.customerXEmail && workspace.customerXId) {
                        for (const metric of this.metricsCustomerX) {
                            switch (metric.name) {
                                case CustomerXMetrics.QTD_aguardando_atendimento:
                                case CustomerXMetrics.QTD_avaliações_baixas:
                                    const key = metric.key(workspace.id);
                                    const teams = (await client.hkeys(key)) || [];

                                    for (const team of teams) {
                                        const valueStr = await client.hget(key, team);
                                        const value = parseInt(valueStr, 10);

                                        await this.sendTracking({
                                            email: workspace.customerXEmail,
                                            external_id_client: workspace.customerXId,
                                            type_tracking: TrackingType.metric,
                                            identifier: `${metric.name}_${team}`, // nome da métrica concatenado com o ID do time
                                            amount: value, // valor do time salvo no redis
                                        });

                                        await client.hset(key, team, 0);
                                    }
                                    break;
                                case CustomerXMetrics.QTD_espera_maior_uma_hora:
                                    const result =
                                        await this.externalDataService.getCountAttendanceWaitingTimeGroupedBy(
                                            workspace.id,
                                        );

                                    if (result?.length) {
                                        for (const item of result) {
                                            if (item._id && item.count) {
                                                await this.sendTracking({
                                                    email: workspace.customerXEmail,
                                                    external_id_client: workspace.customerXId,
                                                    type_tracking: TrackingType.metric,
                                                    identifier: `${metric.name}_${item._id}`,
                                                    amount: item?.count,
                                                });
                                            }
                                        }
                                    }
                                    break;
                                default:
                                    console.log('Metric not exist');
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('ERROR CRON CustomerXService.consumeMetrics: ', e);
            Sentry.captureEvent({
                message: 'ERROR CRON CustomerXService.consumeMetrics',
                extra: {
                    error: e,
                },
            });
        }
    }

    async sendBillingTracking(data: IBillingCreatedPaymentEvent) {
        try {
            if (data.workspaceId && data?.items?.length) {
                const metricsExcessPayment = [
                    { name: CustomerXMetrics.QTD_usuarios_excedentes, type: PaymentItemTypes.user },
                    { name: CustomerXMetrics.QTD_atendimentos_excedentes, type: PaymentItemTypes.conversation },
                ];

                const workspace = await this.externalDataService.getWorkspaceById(data.workspaceId);

                if (workspace && !!workspace?.active && workspace?.customerXEmail && workspace?.customerXId) {
                    for (const metric of metricsExcessPayment) {
                        const value = data.items?.find((currItem) => currItem?.type === metric.type)?.quantity;
                        if (value && value > 0) {
                            this.sendTracking({
                                email: workspace.customerXEmail,
                                external_id_client: workspace.customerXId,
                                identifier: metric.name,
                                type_tracking: TrackingType.metric,
                                amount: value,
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('ERROR CustomerXService.sendBillingTracking: ', e);
        }
    }

    async sendTracking(data: SendTracking): Promise<void> {
        try {
            if (isNaN(data.amount) || data.amount === 0) {
                return;
            }

            await this.customerXApi.post('', data);
        } catch (e) {
            console.error('ERROR CustomerXService.sendTracking: ', e);
        }
    }
}
