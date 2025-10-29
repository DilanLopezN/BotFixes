import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { IAgentStatusEvent, KissbotEventType } from 'kissbot-core';
import { EventsService } from './../../events/events.service';
import { WorkingTimeService } from './working-time.service';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../common/utils/prom-metrics';
import { getQueueName } from '../../../common/utils/get-queue-name';

@Injectable()
export class AgentStatusConsumerService {
    private readonly logger = new Logger(AgentStatusConsumerService.name);

    constructor(
        private readonly workingTimeService: WorkingTimeService,
        public readonly eventsService: EventsService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
        routingKey: [KissbotEventType.START_AGENT_STATUS_INACTIVE, KissbotEventType.END_AGENT_STATUS_INACTIVE],
        queue: getQueueName('agent-status-consumer'),
        queueOptions: {
            durable: true,
            channel: AgentStatusConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    async processEvent(event: any) {
        const timer = rabbitMsgLatency.labels(AgentStatusConsumerService.name).startTimer();
        rabbitMsgCounter.labels(AgentStatusConsumerService.name).inc();
        try {
            if (typeof event !== 'object' || event === null || !event.data) return;

            const { workspaceId, userId } = event.data as IAgentStatusEvent;
            if (!workspaceId || !userId) {
                return;
            }

            switch (event.type) {
                case KissbotEventType.START_AGENT_STATUS_INACTIVE:
                    await this.workingTimeService.startBreakInactive(workspaceId, userId);
                    break;
                case KissbotEventType.END_AGENT_STATUS_INACTIVE:
                    await this.workingTimeService.endBreak(workspaceId, userId);
                    break;
            }
        } catch (e) {
            console.log(
                'AgentStatusConsumerService.processEvent',
                event?.type || 'unknown',
                JSON.stringify(event?.data || {}),
            );
            rabbitMsgCounterError.labels(AgentStatusConsumerService.name).inc();
            throw e;
        }
        timer();
    }
}
