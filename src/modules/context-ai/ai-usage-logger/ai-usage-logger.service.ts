import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiUsageLoggerRepository } from './ai-usage-logger.entity';
import { AiModelPricing } from './ai-usage-logger';
import { CONTEXT_AI } from '../ormconfig';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { AiUsageEntity } from './ai-usage-logger.interface';
import { getQueueName } from '../../../common/utils/get-queue-name';

@Injectable()
export class AiUsageLoggerService {
    constructor(
        @InjectRepository(AiUsageLoggerRepository, CONTEXT_AI)
        private readonly aiUsageLoggerRepository: Repository<AiUsageLoggerRepository>,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
        queue: getQueueName('ai-usage-logger'),
        routingKey: ['api.ai-usage-logger'],
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: AiUsageLoggerService.name,
        },
    })
    async logUsage(event: string): Promise<void> {
        try {
            const data: AiUsageEntity = JSON.parse(event);

            const pricing = AiModelPricing[data.model];
            if (!pricing) throw new Error('Modelo ou provedor inválido');

            const usageLog = this.aiUsageLoggerRepository.create({
                integrationId: data.integrationId,
                workspaceId: data.workspaceId,
                inputTokens: data.inputTokens,
                outputTokens: data.outputTokens,
                inputCostPerTokenUSD: pricing.input,
                outputCostPerTokenUSD: pricing.output,
                inputPrompt: data.inputPrompt,
                outputResponse: data.outputResponse,
                model: data.model,
                provider: data.provider,
                originModule: data.originModule,
                originTable: data.originTable,
                originRecordId: data.originRecordId,
            });

            await this.aiUsageLoggerRepository.save(usageLog);
        } catch (err) {
            console.error(err);
        }
    }
}
