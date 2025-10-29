import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
    ConversationOrchestrator,
    ConversationProcessor,
    ProcessingContext,
    ProcessingResult,
} from '../interfaces/conversation-processor.interface';
import { InputGuardrailsProcessor } from '../processors/input-guardrails-processor';
import { QuestionRewriteProcessor } from '../processors/question-rewrite-processor';
import { SmallTalkProcessor } from '../processors/small-talk-processor';
import { ToolProcessor } from '../processors/tool-processor';
import { RagProcessor } from '../processors/rag-processor';
import { ConversationalAgentProcessor } from '../processors/conversational-agent-processor';
import { ConversationTraceService } from './conversation-trace.service';
import { ProcessorStatus, ProcessorTrace } from '../interfaces/conversation-trace.interface';

const Colors = {
    Reset: '\x1b[0m',
    Dim: '\x1b[2m',
    Red: '\x1b[31m',
    Green: '\x1b[32m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m',
    White: '\x1b[37m',
    Orange: '\x1b[38;5;208m',
    Pink: '\x1b[38;5;205m',
    Purple: '\x1b[38;5;135m',
} as const;

const ProcessorColors: Record<string, string> = {
    InputGuardrailsProcessor: Colors.Red,
    SmallTalkProcessor: Colors.Magenta,
    ConversationalAgentProcessor: Colors.Purple,
    QuestionRewriteProcessor: Colors.Yellow,
    ToolProcessor: Colors.Green,
    RagProcessor: Colors.Blue,
    FileExtractProcessor: Colors.Orange,
    FallbackProcessor: Colors.Pink,
    DefaultProcessor: Colors.Purple,
};

@Injectable()
export class ConversationOrchestratorService implements ConversationOrchestrator, OnModuleInit {
    private readonly logger = new Logger(ConversationOrchestratorService.name);
    private readonly processors: ConversationProcessor[] = [];

    constructor(
        private readonly inputGuardrailsProcessor: InputGuardrailsProcessor,
        private readonly questionRewriteProcessor: QuestionRewriteProcessor,
        private readonly smallTalkProcessor: SmallTalkProcessor,
        private readonly conversationalAgentProcessor: ConversationalAgentProcessor,
        private readonly toolProcessor: ToolProcessor,
        private readonly ragProcessor: RagProcessor,
        private readonly traceService: ConversationTraceService,
    ) {}

    onModuleInit() {
        this.registerProcessor(this.inputGuardrailsProcessor, 100);
        this.registerProcessor(this.smallTalkProcessor, 90);
        this.registerProcessor(this.conversationalAgentProcessor, 75);
        this.registerProcessor(this.toolProcessor, 70);
        this.registerProcessor(this.questionRewriteProcessor, 60);
        this.registerProcessor(this.ragProcessor, 10);
    }

    registerProcessor(processor: ConversationProcessor, priority?: number): void {
        if (priority !== undefined) {
            processor.priority = priority;
        }
        this.processors.push(processor);
        this.processors.sort((a, b) => b.priority - a.priority);
    }

    getProcessors(): ConversationProcessor[] {
        return [...this.processors];
    }

    private logProcessorTiming(processor: ConversationProcessor, durationMs: number, status: string): void {
        const durationFormatted = durationMs < 1 ? `${durationMs.toFixed(3)}ms` : `${durationMs.toFixed(1)}ms`;

        const processorColor = ProcessorColors[processor.constructor.name] || Colors.White;
        const statusColor = this.getStatusColor(status);

        const message = `${processorColor}[${processor.name}]${Colors.Reset} ${Colors.Dim}→${Colors.Reset} ${statusColor}${status}${Colors.Reset} ${Colors.Dim}(${durationFormatted})${Colors.Reset}`;

        console.log(message);
    }

    private getStatusColor(status: string): string {
        switch (status) {
            case 'SKIP':
                return Colors.Dim;
            case 'STOP':
                return Colors.Cyan;
            case 'CONTINUE':
                return Colors.Yellow;
            case 'ERROR':
                return Colors.Red;
            default:
                return Colors.White;
        }
    }

    async process(context: ProcessingContext): Promise<ProcessingResult> {
        let currentContext = context;

        const trace = await this.traceService.startTrace({
            contextId: context.contextId,
            workspaceId: context.workspaceId,
            agentId: context.agent.id,
            userMessage: context.message,
            debugMode: context.debug || false,
        });

        for (const processor of this.processors) {
            const startTime = process.hrtime.bigint();
            const processorStartTime = new Date().toISOString();

            try {
                const canHandle = await processor.canHandle(currentContext);

                if (canHandle) {
                    if (context.debug) {
                        this.logger.log(`[Orchestrator] Executando: ${processor.name}`);
                    }

                    const result = await processor.process(currentContext);

                    const endTime = process.hrtime.bigint();
                    const durationMs = Number(endTime - startTime) / 1_000_000;
                    const status = result.shouldContinue ? 'CONTINUE' : 'STOP';
                    this.logProcessorTiming(processor, durationMs, status);

                    const processorTrace: ProcessorTrace = {
                        processorName: processor.name,
                        priority: processor.priority,
                        startTime: processorStartTime,
                        endTime: new Date().toISOString(),
                        durationMs,
                        status: result.shouldContinue
                            ? ProcessorStatus.EXECUTED_CONTINUE
                            : ProcessorStatus.EXECUTED_STOP,
                        canHandle: true,
                        output: result.metadata,
                        decision: {
                            reason: this.traceService.extractDecisionReason(result),
                            metadata: result.metadata,
                        },
                    };
                    await this.traceService.addProcessorTrace(trace.traceId, processorTrace);

                    // Se o processador retornou um contexto atualizado, usa ele para os próximos processadores
                    if (result.metadata?.rewrittenContext) {
                        currentContext = result.metadata.rewrittenContext;
                    }

                    if (!result.shouldContinue) {
                        await this.traceService.endTrace(trace.traceId, result.content || '');

                        if (context.debug) {
                            const fullTrace = await this.traceService.getTrace(trace.traceId, context.workspaceId);
                            if (fullTrace) {
                                console.log(this.traceService.formatTraceForConsole(fullTrace));
                            }
                        }

                        result.traceId = trace.traceId;
                        return result;
                    }

                    if (result.metadata) {
                        currentContext.metadata = {
                            ...currentContext.metadata,
                            ...result.metadata,
                        };
                    }
                } else {
                    const endTime = process.hrtime.bigint();
                    const durationMs = Number(endTime - startTime) / 1_000_000;
                    this.logProcessorTiming(processor, durationMs, 'SKIP');

                    const processorTrace: ProcessorTrace = {
                        processorName: processor.name,
                        priority: processor.priority,
                        startTime: processorStartTime,
                        endTime: new Date().toISOString(),
                        durationMs,
                        status: ProcessorStatus.SKIPPED,
                        canHandle: false,
                        decision: {
                            reason: 'Processor cannot handle this context',
                        },
                    };
                    await this.traceService.addProcessorTrace(trace.traceId, processorTrace);
                }
            } catch (error) {
                const endTime = process.hrtime.bigint();
                const durationMs = Number(endTime - startTime) / 1_000_000;
                this.logProcessorTiming(processor, durationMs, 'ERROR');

                this.logger.error(`[Orchestrator] Erro no processor ${processor.name}:`, error.message);

                const processorTrace: ProcessorTrace = {
                    processorName: processor.name,
                    priority: processor.priority,
                    startTime: processorStartTime,
                    endTime: new Date().toISOString(),
                    durationMs,
                    status: ProcessorStatus.ERROR,
                    canHandle: false,
                    error: error.message || String(error),
                    decision: {
                        reason: 'Processor threw an error',
                    },
                };
                await this.traceService.addProcessorTrace(trace.traceId, processorTrace);

                // Continua para o próximo processor em caso de erro
                continue;
            }
        }

        // Se nenhum processador parou o fluxo, retorna um resultado padrão
        if (context.debug) {
            this.logger.warn('[Orchestrator] Nenhum processor finalizou o processamento');
        }

        const result = {
            content: null,
            shouldContinue: false,
            metadata: {
                processorType: 'none',
                allProcessorsFailed: true,
            },
            traceId: trace.traceId,
        };

        await this.traceService.endTrace(trace.traceId, '');
        return result;
    }
}
