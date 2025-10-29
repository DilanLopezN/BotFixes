import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { AckType, IWhatswebMessageAckErrorDelay, KissbotEvent, KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../../common/utils/get-queue-name';
import { GupshupService } from './gupshup.service';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../common/utils/prom-metrics';
import { ActiveMessageService } from '../../../active-message/services/active-message.service';
import { CacheService } from '../../../_core/cache/cache.service';
import { GupshupIdHashService } from './gupshup-id-hash.service';
import { GupshupUtilService } from './gupshup-util.service';
import { ExternalDataService } from './external-data.service';
import * as Sentry from '@sentry/node';

@Injectable()
export class GupshupCheckAckErrorConsumer {
    private readonly logger = new Logger(GupshupCheckAckErrorConsumer.name);

    constructor(
        private readonly cacheService: CacheService,
        private readonly gshpService: GupshupService,
        private readonly activeMessageService: ActiveMessageService,
        private readonly gupshupIdHashService: GupshupIdHashService,
        private readonly gupshupUtilService: GupshupUtilService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    @RabbitSubscribe({
        exchange: `${process.env.EVENT_EXCHANGE_NAME}_delay`,
        routingKey: KissbotEventType.WHATSWEB_MESSAGE_ACK_ERROR_DELAY,
        queue: getQueueName('gupshup-ack-error-delay'),
        queueOptions: {
            durable: true,
            channel: GupshupCheckAckErrorConsumer.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    async processEvent(ev: KissbotEvent) {
        rabbitMsgCounter.labels(GupshupCheckAckErrorConsumer.name).inc();
        try {
            switch (ev.type) {
                case KissbotEventType.WHATSWEB_MESSAGE_ACK_ERROR_DELAY: {
                    const data: IWhatswebMessageAckErrorDelay = ev.data as IWhatswebMessageAckErrorDelay;
                    const { ack, channelConfigToken, gsId, workspaceId, timestamp, phoneNumber } = data;

                    const client = await this.cacheService.getClient();
                    const key = this.gupshupUtilService.getActivtyGupshupIdHashCacheKey(gsId);
                    let activityHash = await client.get(key);

                    if (!activityHash) {
                        activityHash = await client.get(key);
                        if (!activityHash) {
                            activityHash = await this.gupshupIdHashService.findHashByGsId(gsId);
                            // if (!activityHash) {
                            //     return;
                            // }
                        }
                    }

                    if (!!activityHash) {
                        const activityAcks = await this.externalDataService.findAckByHash(activityHash);
                        const hasDeliveryAck = activityAcks?.some((value) => value.ack >= AckType.DeliveryAck);
                        if (!hasDeliveryAck) {
                            this.activeMessageService.checkMissingReceived(
                                phoneNumber,
                                channelConfigToken,
                                String(ack),
                            );
                            const hash = await this.gshpService.updateActivityAck(
                                gsId,
                                ack,
                                channelConfigToken,
                                null,
                                workspaceId,
                                timestamp,
                            );
                            this.gshpService.handleNumberDontExistsCallback(hash);
                        } else {
                            Sentry.captureEvent({
                                message: `GupshupCheckAckErrorConsumer.processEvent 1`,
                                extra: {
                                    event: ev,
                                },
                            });
                        }
                    } else {
                        Sentry.captureEvent({
                            message: `GupshupCheckAckErrorConsumer.processEvent 2`,
                            extra: {
                                event: ev,
                            },
                        });
                    }
                }
            }
        } catch (e) {
            rabbitMsgCounterError.labels(GupshupCheckAckErrorConsumer.name).inc();
        }
    }
}
