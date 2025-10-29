import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ConversationTrace,
    ConversationTraceService as IConversationTraceService,
    ProcessorStatus,
    ProcessorTrace,
} from '../interfaces/conversation-trace.interface';
import { ConversationTraceEntity } from '../entities/conversation-trace.entity';
import { CONTEXT_AI } from '../../ormconfig';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConversationTraceService implements IConversationTraceService {
    private readonly logger = new Logger(ConversationTraceService.name);

    constructor(
        @InjectRepository(ConversationTraceEntity, CONTEXT_AI)
        private readonly traceRepository: Repository<ConversationTraceEntity>,
    ) {}

    async startTrace(params: {
        contextId: string;
        workspaceId: string;
        agentId: string;
        userMessage: string;
        debugMode: boolean;
    }): Promise<ConversationTrace> {
        const traceId = uuidv4();

        const trace: ConversationTrace = {
            traceId,
            contextId: params.contextId,
            workspaceId: params.workspaceId,
            agentId: params.agentId,
            startTime: new Date().toISOString(),
            userMessage: params.userMessage,
            processors: [],
            metadata: {
                debugMode: params.debugMode,
                totalProcessorsExecuted: 0,
                totalProcessorsSkipped: 0,
                hasErrors: false,
                errors: [],
                tags: [],
            },
        };

        await this.saveTrace(trace);
        return trace;
    }

    async addProcessorTrace(traceId: string, processorTrace: ProcessorTrace): Promise<void> {
        try {
            const entity = await this.traceRepository.findOne({
                where: { traceId },
            });

            if (!entity) {
                return;
            }

            entity.processors.push(processorTrace);

            if (processorTrace.status === ProcessorStatus.SKIPPED) {
                entity.totalProcessorsSkipped++;
                entity.metadata.totalProcessorsSkipped++;
            } else {
                entity.totalProcessorsExecuted++;
                entity.metadata.totalProcessorsExecuted++;
            }

            if (processorTrace.status === ProcessorStatus.ERROR) {
                entity.hasErrors = true;
                entity.metadata.hasErrors = true;
                if (processorTrace.error) {
                    if (!entity.metadata.errors) {
                        entity.metadata.errors = [];
                    }
                    entity.metadata.errors.push(`${processorTrace.processorName}: ${processorTrace.error}`);
                }
            }

            if (processorTrace.status === ProcessorStatus.EXECUTED_STOP) {
                entity.responseSource = processorTrace.processorName;
                entity.metadata.responseSource = processorTrace.processorName;
                entity.metadata.responseType = processorTrace.output?.processorType;
            }

            await this.traceRepository.save(entity);
        } catch (error) {
            this.logger.error(`[Trace] Error adding processor trace ${traceId}:`, error);
        }
    }

    async endTrace(traceId: string, finalResponse: string): Promise<void> {
        try {
            const entity = await this.traceRepository.findOne({
                where: { traceId },
            });

            if (!entity) {
                return;
            }

            const endTime = new Date();
            entity.endTime = endTime;
            entity.finalResponse = finalResponse;
            entity.durationMs = endTime.getTime() - entity.startTime.getTime();

            await this.traceRepository.save(entity);
        } catch (error) {
            this.logger.error(`[Trace] Error ending trace ${traceId}:`, error);
        }
    }

    async getTrace(traceId: string, workspaceId: string): Promise<ConversationTrace | null> {
        try {
            const entity = await this.traceRepository.findOne({
                where: {
                    traceId,
                    workspaceId,
                },
            });

            if (!entity) {
                return null;
            }

            return this.entityToTrace(entity);
        } catch (error) {
            this.logger.error(`[Trace] Error fetching trace ${traceId}:`, error);
            return null;
        }
    }

    async getTracesByContext(contextId: string, limit: number = 10, workspaceId: string): Promise<ConversationTrace[]> {
        try {
            const query = this.traceRepository.createQueryBuilder('trace');

            query.andWhere('trace.contextId = :contextId', { contextId });
            query.andWhere('trace.workspaceId = :workspaceId', { workspaceId });

            query.orderBy('trace.createdAt', 'DESC');
            query.limit(limit);

            const entities = await query.getMany();

            return entities.map((entity) => this.entityToTrace(entity));
        } catch (error) {
            this.logger.error(`[Trace] Error fetching traces for context ${contextId}:`, error);
            return [];
        }
    }

    private entityToTrace(entity: ConversationTraceEntity): ConversationTrace {
        return {
            traceId: entity.traceId,
            contextId: entity.contextId,
            workspaceId: entity.workspaceId,
            agentId: entity.agentId,
            userMessage: entity.userMessage,
            finalResponse: entity.finalResponse || undefined,
            startTime: entity.startTime.toISOString(),
            endTime: entity.endTime?.toISOString(),
            durationMs: entity.durationMs || undefined,
            processors: entity.processors,
            metadata: entity.metadata as any,
        };
    }

    extractDecisionReason(result: { metadata?: Record<string, any>; shouldContinue: boolean }): string {
        if (result.metadata?.processorType) {
            return `Handled by ${result.metadata.processorType}`;
        }
        if (result.metadata?.reason) {
            return result.metadata.reason;
        }
        return result.shouldContinue ? 'Continues to next processor' : 'Stopped processing';
    }

    formatTraceForConsole(trace: ConversationTrace): string {
        const lines: string[] = [];

        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        lines.push(`📝 Message: "${trace.userMessage}"`);
        lines.push(`⏱️  Duration: ${trace.durationMs}ms`);
        lines.push(`🎯 Response Source: ${trace.metadata.responseSource || 'unknown'}`);
        lines.push('');
        lines.push('🔄 Processor Chain:');

        trace.processors.forEach((proc, index) => {
            const icon = this.getProcessorStatusIcon(proc.status);
            const indent = '  ';

            lines.push(`${indent}${index + 1}. ${icon} ${proc.processorName} (${proc.durationMs.toFixed(1)}ms)`);
            lines.push(`${indent}   Status: ${proc.status}`);

            if (proc.decision) {
                lines.push(`${indent}   Reason: ${proc.decision.reason}`);
                if (proc.decision.confidence !== undefined) {
                    lines.push(`${indent}   Confidence: ${(proc.decision.confidence * 100).toFixed(0)}%`);
                }
            }

            if (proc.error) {
                lines.push(`${indent}   ❌ Error: ${proc.error}`);
            }

            lines.push('');
        });

        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        lines.push('');

        return lines.join('\n');
    }

    private getProcessorStatusIcon(status: ProcessorStatus): string {
        switch (status) {
            case ProcessorStatus.SKIPPED:
                return '⏭️ ';
            case ProcessorStatus.EXECUTED_CONTINUE:
                return '▶️ ';
            case ProcessorStatus.EXECUTED_STOP:
                return '✅';
            case ProcessorStatus.ERROR:
                return '❌';
            default:
                return '❓';
        }
    }

    private sanitizeTrace(trace: ConversationTrace): ConversationTrace {
        return {
            ...trace,
            processors: trace.processors.map((proc) => ({
                ...proc,
                output: proc.output ? this.sanitizeMetadata(proc.output) : undefined,
                decision: proc.decision
                    ? {
                          reason: proc.decision.reason,
                          confidence: proc.decision.confidence,
                          metadata: proc.decision.metadata ? this.sanitizeMetadata(proc.decision.metadata) : undefined,
                      }
                    : undefined,
            })),
            metadata: this.sanitizeMetadata(trace.metadata as any),
        };
    }

    private sanitizeMetadata(metadata: any): any {
        if (!metadata || typeof metadata !== 'object') {
            return metadata;
        }

        const sanitized = { ...metadata };
        delete sanitized.rewrittenContext;

        return sanitized;
    }

    private async saveTrace(trace: ConversationTrace): Promise<void> {
        try {
            const sanitizedTrace = this.sanitizeTrace(trace);

            const entity = new ConversationTraceEntity();
            entity.traceId = sanitizedTrace.traceId;
            entity.contextId = sanitizedTrace.contextId;
            entity.workspaceId = sanitizedTrace.workspaceId;
            entity.agentId = sanitizedTrace.agentId;
            entity.userMessage = sanitizedTrace.userMessage;
            entity.finalResponse = sanitizedTrace.finalResponse || null;
            entity.startTime = new Date(sanitizedTrace.startTime);
            entity.endTime = sanitizedTrace.endTime ? new Date(sanitizedTrace.endTime) : null;
            entity.durationMs = sanitizedTrace.durationMs || null;
            entity.processors = sanitizedTrace.processors;
            entity.metadata = sanitizedTrace.metadata;
            entity.responseSource = sanitizedTrace.metadata.responseSource || null;
            entity.hasErrors = sanitizedTrace.metadata.hasErrors;
            entity.totalProcessorsExecuted = sanitizedTrace.metadata.totalProcessorsExecuted;
            entity.totalProcessorsSkipped = sanitizedTrace.metadata.totalProcessorsSkipped;

            await this.traceRepository.save(entity);
        } catch (error) {
            this.logger.error(`[Trace] Error saving trace ${trace.traceId}:`, error);
        }
    }

    async getContextStatistics(
        contextId: string,
        workspaceId?: string,
    ): Promise<{
        totalTraces: number;
        averageDurationMs: number;
        mostUsedProcessor: string;
        errorRate: number;
        processorStats: Array<{
            processorName: string;
            count: number;
            percentage: number;
            averageDurationMs: number;
            errorCount: number;
        }>;
    }> {
        const traces = await this.getTracesByContext(contextId, 50, workspaceId);

        if (traces.length === 0) {
            return {
                totalTraces: 0,
                averageDurationMs: 0,
                mostUsedProcessor: '',
                errorRate: 0,
                processorStats: [],
            };
        }

        const totalDuration = traces.reduce((sum, t) => sum + (t.durationMs || 0), 0);

        const processorData = new Map<
            string,
            {
                count: number;
                totalDuration: number;
                errorCount: number;
            }
        >();

        let totalErrors = 0;

        traces.forEach((trace) => {
            if (trace.metadata.hasErrors) {
                totalErrors++;
            }

            if (trace.metadata.responseSource) {
                const processorName = trace.metadata.responseSource;
                const data = processorData.get(processorName) || {
                    count: 0,
                    totalDuration: 0,
                    errorCount: 0,
                };

                data.count++;
                data.totalDuration += trace.durationMs || 0;
                if (trace.metadata.hasErrors) {
                    data.errorCount++;
                }

                processorData.set(processorName, data);
            }
        });

        const processorStats = Array.from(processorData.entries())
            .map(([processorName, data]) => ({
                processorName,
                count: data.count,
                percentage: (data.count / traces.length) * 100,
                averageDurationMs: data.totalDuration / data.count,
                errorCount: data.errorCount,
            }))
            .sort((a, b) => b.count - a.count);

        const mostUsedProcessor = processorStats[0]?.processorName || '';

        return {
            totalTraces: traces.length,
            averageDurationMs: totalDuration / traces.length,
            mostUsedProcessor,
            errorRate: totalErrors / traces.length,
            processorStats,
        };
    }
}
