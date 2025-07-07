import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable, Logger } from "@nestjs/common";
import { IInteractionFallbackRecognizedEvent, KissbotEvent, KissbotEventType } from "kissbot-core";
import { Fallback } from "kissbot-entities";
import { getQueueName } from "../../../../utils/get-queue-name";
import { FallbackService } from "./fallback.service";

@Injectable()
export class FallbackConsumerService {
    private readonly logger = new Logger(FallbackConsumerService.name);
    constructor(
        private readonly fallbackService: FallbackService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
        routingKey: [
            KissbotEventType.INTERACTION_FALLBACK_RECOGNIZED,
        ],
        queue: getQueueName('analytics-fallback'),
        queueOptions: {
            durable: true,
            channel: FallbackConsumerService.name,
        },
    })
    private async consumer(event: KissbotEvent) {
        switch (event.type) {
            case (KissbotEventType.INTERACTION_FALLBACK_RECOGNIZED): {
               return await this.handleFallbackRecognized(event.data as any);
            }
        }
    }

    private async handleFallbackRecognized(data: IInteractionFallbackRecognizedEvent) {
        try {
            if (data.message && data.message?.length > 3 && data.channelId != 'webemulator') {
                if (!data.channelId) {
                    this.logger.debug('handleFallbackRecognized: invalid channelId')
                    this.logger.debug(JSON.stringify(data));
                }
                const fallback = {
                    contextId: data.contextId,
                    interactionId: data.interactionId,
                    workspaceId: data.workspaceId,
                    interactionName: data.interactionName,
                    recognizedTimestamp: data.recognizedTimestamp,
                    botId: data.botId,
                    message: data.message,
                    conversationId: data.conversationId,
                    channelId: data.channelId,
                } as Fallback;
                await this.fallbackService._create(fallback);
            }
        } catch (e) {
            this.logger.error(e)
        }
    }
}