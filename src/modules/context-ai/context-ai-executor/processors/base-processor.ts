import { Logger } from '@nestjs/common';
import {
    ConversationProcessor,
    ProcessingContext,
    ProcessingResult,
    NextStep,
} from '../interfaces/conversation-processor.interface';

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
    RagProcessor: Colors.Blue,
    QuestionRewriteImplementationService: Colors.Yellow,
    SmallTalkImplementationService: Colors.Magenta,
    GuardrailProcessor: Colors.Red,
    ContextAiProcessor: Colors.Cyan,
    FileExtractProcessor: Colors.Orange,
    FallbackProcessor: Colors.Pink,
    DefaultProcessor: Colors.Purple,
};

export abstract class BaseProcessor implements ConversationProcessor {
    protected readonly logger: Logger;
    private readonly processorColor: string;

    constructor(public readonly name: string, public priority: number = 50) {
        this.logger = new Logger(this.constructor.name);
        this.processorColor = ProcessorColors[this.constructor.name] || Colors.White;
    }

    abstract canHandle(context: ProcessingContext): Promise<boolean>;
    abstract process(context: ProcessingContext): Promise<ProcessingResult>;

    protected logDebug(context: ProcessingContext, message: string, ...args: unknown[]): void {
        if (context.debug) {
            const coloredMessage = `${this.processorColor}[${this.name}]${Colors.Reset} ${message}`;
            this.logger.debug(coloredMessage, ...args);
        }
    }

    protected logInfo(context: ProcessingContext, message: string, ...args: unknown[]): void {
        if (context.debug) {
            const coloredMessage = `${this.processorColor}[${this.name}]${Colors.Reset} ${message}`;
            this.logger.log(coloredMessage, ...args);
        }
    }

    protected logError(context: ProcessingContext, message: string, error?: unknown): void {
        if (context.debug) {
            const coloredMessage = `${Colors.Red}[${this.name}] ${message}${Colors.Reset}`;
            this.logger.error(coloredMessage, error);
        }
    }

    protected createResult(
        content: string | null,
        shouldContinue: boolean = false,
        metadata?: Record<string, any>,
        nextStep?: NextStep,
    ): ProcessingResult {
        return {
            content,
            shouldContinue,
            metadata,
            nextStep,
        };
    }

    protected createContinueResult(metadata?: Record<string, any>): ProcessingResult {
        return this.createResult(null, true, metadata);
    }

    protected createStopResult(content: string, metadata?: Record<string, any>, nextStep?: NextStep): ProcessingResult {
        return this.createResult(content, false, metadata, nextStep);
    }

    protected createStopResultWithAudio(
        content: string,
        shouldGenerateAudio: boolean,
        metadata?: Record<string, any>,
        nextStep?: NextStep,
    ): ProcessingResult {
        return {
            content,
            shouldContinue: false,
            metadata: metadata ? this.normalizeMetadata(metadata) : undefined,
            nextStep,
            audioRequest: {
                shouldGenerateAudio,
                processorType: this.name.toLowerCase(),
            },
        };
    }

    private normalizeMetadata(metadata: Record<string, any>): Record<string, any> {
        const { processorName, ...rest } = metadata;
        return {
            processorName: processorName || this.name,
            ...rest,
        };
    }

    protected shouldGenerateAudio(context: ProcessingContext): boolean {
        return context.audioContext?.fromAudio || context.audioContext?.shouldGenerateAudio || false;
    }
}
