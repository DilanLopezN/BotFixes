import { Injectable } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import {
    ProcessingContext,
    ProcessingResult,
    ProcessingMetadata,
    RewriteDecision,
} from '../interfaces/conversation-processor.interface';
import { QuestionRewriteService } from '../../question-rewrite/question-rewrite.service';
import { SessionStateService } from '../services/session-state.service';

@Injectable()
export class QuestionRewriteProcessor extends BaseProcessor {
    constructor(
        private readonly rewriteService: QuestionRewriteService,
        private readonly sessionStateService: SessionStateService,
    ) {
        super(QuestionRewriteProcessor.name);
    }

    async canHandle(_context: ProcessingContext): Promise<boolean> {
        return true;
    }

    async process(context: ProcessingContext): Promise<ProcessingResult> {
        try {
            const hasExceeded = await this.sessionStateService.hasExceededClarificationAttempts(context.contextId);

            if (hasExceeded) {
                if (context.debug) {
                    this.logInfo(
                        context,
                        `Limite de clarificações atingido (${context.contextId}). Prosseguindo sem clarificação.`,
                    );
                }

                await this.sessionStateService.clearClarificationState(context.contextId);

                const newMetadata: ProcessingMetadata = {
                    ...context.metadata,
                    skipClarification: true,
                };

                return this.createContinueResult({
                    rewrittenContext: {
                        ...context,
                        metadata: newMetadata,
                    },
                });
            }

            const rewriteResult = await this.rewriteService.rewriteQuestion({
                agent: context.agent,
                contextId: context.contextId,
                question: context.message,
                referenceId: context.referenceId,
            });

            const wasRewritten = rewriteResult.question !== context.message;

            if (context.debug && wasRewritten) {
                this.logInfo(
                    context,
                    `Pergunta reescrita: "${context.message}" → "${rewriteResult.question}" (${rewriteResult.decision})`,
                );
            }

            if (rewriteResult.decision === RewriteDecision.CLARIFY) {
                if (context.debug) {
                    this.logInfo(context, `Solicitando esclarecimento ao usuário: "${rewriteResult.question}"`);
                }

                this.sessionStateService.setClarificationState(context.contextId, rewriteResult.question);

                const shouldGenerateAudio = this.shouldGenerateAudio(context);

                return this.createStopResultWithAudio(rewriteResult.question, shouldGenerateAudio, {
                    processorType: 'question-rewrite',
                    isClarification: true,
                    tokenUsage: { promptTokens: 0, completionTokens: 0 },
                });
            }

            this.sessionStateService.clearClarificationState(context.contextId);

            const newMetadata: ProcessingMetadata = {
                ...context.metadata,
                originalMessage: context.message,
                wasRewritten,
                rewriteDecision: rewriteResult.decision,
            };

            const newContext: ProcessingContext = {
                ...context,
                message: rewriteResult.question,
                metadata: newMetadata,
            };

            return this.createContinueResult({
                rewrittenContext: newContext,
            });
        } catch (error) {
            this.logError(context, 'Erro ao reescrever pergunta', error);
            throw error;
        }
    }
}
