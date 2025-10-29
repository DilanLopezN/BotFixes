import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ZSetEventManagerService, EventType, ZSetEvent } from './zset-event-manager.service';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';
import { EventsService } from '../../events/events.service';
import { IAgentStatusEvent, KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';

@Injectable()
export class ZSetEventConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ZSetEventConsumerService.name);
    private isProcessing = false;

    constructor(
        private readonly zsetEventManager: ZSetEventManagerService,
        public readonly eventsService: EventsService,
    ) {}

    onModuleInit() {
        this.logger.log('ZSetEventConsumerService initialized');
    }

    onModuleDestroy() {
        this.logger.log('ZSetEventConsumerService destroyed');
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async processExpiredEvents() {
        if (!shouldRunCron()) return;

        if (this.isProcessing) {
            this.logger.debug('Event processing already in progress, skipping...');
            return;
        }

        this.isProcessing = true;

        try {
            const now = Date.now() + 5000; // adiciona mais 5seg na busca para expirar sincronizado com front
            const expiredEvents = await this.zsetEventManager.getExpiredEvents(now);

            if (expiredEvents.length === 0) {
                this.logger.debug(`No expired events to process (searched with timestamp: ${now})`);
                return;
            }

            this.logger.log(`Processing ${expiredEvents.length} expired events (timestamp: ${now})`);

            let successfullyProcessed = 0;
            let failedToProcess = 0;

            for (const event of expiredEvents) {
                try {
                    await this.processEvent(event);
                    successfullyProcessed++;
                } catch (error) {
                    failedToProcess++;
                    this.logger.error(`Failed to process event ${event.type} for user ${event.userId}:`, error);
                }
            }

            this.logger.log(
                `Sent ${successfullyProcessed}/${expiredEvents.length} events to queue (${failedToProcess} failed). Events will be removed from Redis after successful processing by consumer.`,
            );
        } catch (error) {
            this.logger.error('Error processing expired events:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processEvent(event: ZSetEvent): Promise<void> {
        switch (event.type) {
            case EventType.LAST_ACCESS:
                await this.processLastAccessEvent(event);
                break;
            case EventType.BREAK_EXPIRATION:
                await this.processBreakExpirationEvent(event);
                break;
            default:
                this.logger.warn(`Unknown event type: ${event.type}`);
        }
    }

    private async processLastAccessEvent(event: ZSetEvent): Promise<void> {
        const { workspaceId, userId } = event;

        this.logger.debug(`Processing LAST_ACCESS event for user ${userId} in workspace ${workspaceId}`);

        try {
            // Inicia pausa por inatividade
            this.eventsService.sendEvent({
                data: { workspaceId, userId } as IAgentStatusEvent,
                dataType: KissbotEventDataType.AGENT_STATUS,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.START_AGENT_STATUS_INACTIVE,
            });
            this.logger.log(`Started inactive break for user ${userId} in workspace ${workspaceId}`);
        } catch (error) {
            this.logger.error(`Failed to start inactive break for user ${userId}:`, error);
        }
    }

    private async processBreakExpirationEvent(event: ZSetEvent): Promise<void> {
        const { workspaceId, userId, payload } = event;

        this.logger.debug(`Processing BREAK_EXPIRATION event for user ${userId} in workspace ${workspaceId}`);

        try {
            // Finaliza a pausa
            this.eventsService.sendEvent({
                data: { workspaceId, userId } as IAgentStatusEvent,
                dataType: KissbotEventDataType.AGENT_STATUS,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.END_AGENT_STATUS_INACTIVE,
            });
            this.logger.log(`Ended break for user ${userId} in workspace ${workspaceId} due to max inactivity`);
        } catch (error) {
            this.logger.error(`Failed to end break for user ${userId}:`, error);
        }
    }

    async processEventManually(eventType: EventType, workspaceId: string, userId: string): Promise<void> {
        const event: ZSetEvent = {
            type: eventType,
            workspaceId,
            userId,
            timestamp: Date.now(),
        };

        await this.processEvent(event);
    }
}
