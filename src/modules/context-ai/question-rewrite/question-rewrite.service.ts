import { Injectable } from '@nestjs/common';
import { AiProviderService } from '../ai-provider/ai.service';
import { ContextMessageService } from '../context-message/context-message.service';
import { HistoryManagerService } from '../context-ai-executor/services/history-manager.service';
import { SessionStateService } from '../context-ai-executor/services/session-state.service';
import { DEFAULT_AI_MODEL } from '../context-ai-executor/enums/ai-models.enum';
import { RewriteDecision } from '../context-ai-executor/interfaces/conversation-processor.interface';
import { ContextMessageRole, ContextMessageType } from '../context-message/interfaces/context-message.interface';
import { CreateContextMessage } from '../context-message/interfaces/create-context-message.interface';
import { isOnlyEmojis } from '../../../common/utils/isOnlyOneEmoji';
import { RewritePromptBuilder } from './builders/rewrite-prompt.builder';
import { RewriteQuestionParams, RewriteResult, RewriteResponse } from './interfaces/rewrite-result.interface';

@Injectable()
export class QuestionRewriteService {
    constructor(
        private readonly historyManagerService: HistoryManagerService,
        private readonly aiProviderService: AiProviderService,
        private readonly contextMessageService: ContextMessageService,
        private readonly sessionStateService: SessionStateService,
        private readonly rewritePromptBuilder: RewritePromptBuilder,
    ) {}

    public async rewriteQuestion({
        agent,
        contextId,
        question,
        referenceId,
    }: RewriteQuestionParams): Promise<RewriteResult> {
        if (isOnlyEmojis(question)) {
            return {
                question,
                decision: RewriteDecision.COPY,
            };
        }

        const history = await this.historyManagerService.getHistoryMessages({
            agent,
            contextId,
            limit: 5,
        });

        const clarificationState = await this.sessionStateService.getClarificationState(contextId);

        const rewritePrompt = this.rewritePromptBuilder.build(question, clarificationState);

        const aiResponse = await this.aiProviderService.execute({
            messages: history,
            prompt: rewritePrompt,
            maxTokens: 1_024,
            temperature: 0.2,
            model: DEFAULT_AI_MODEL,
        });

        let rewriteResponse: RewriteResponse;
        let rewriteQuestion: string = question;
        let decision: RewriteDecision = RewriteDecision.COPY;

        try {
            const jsonResponse = JSON.parse(aiResponse?.message || '{}');
            rewriteResponse = jsonResponse as RewriteResponse;

            if (!rewriteResponse.decision) {
                throw new Error('Invalid response format');
            }

            decision = rewriteResponse.decision;

            switch (rewriteResponse.decision) {
                case RewriteDecision.COPY:
                    rewriteQuestion = question;

                    if (clarificationState) {
                        console.log('[QuestionRewrite] Nova pergunta detectada, limpando clarificação pendente');
                        await this.sessionStateService.clearClarificationState(contextId);
                    }
                    break;
                case RewriteDecision.REWRITE:
                    if (rewriteResponse.rewritten) {
                        rewriteQuestion = rewriteResponse.rewritten;
                    } else {
                        rewriteQuestion = question;
                    }

                    if (clarificationState) {
                        console.log('[QuestionRewrite] Reescrita processada, limpando estado de clarificação');
                        await this.sessionStateService.clearClarificationState(contextId);
                    }
                    break;
                case RewriteDecision.CLARIFY:
                    rewriteQuestion = rewriteResponse.clarification || 'Poderia esclarecer sua pergunta?';
                    break;
                default:
                    rewriteQuestion = question;
            }
        } catch (error) {
            console.error('Failed to parse rewrite response JSON:', error);
            rewriteQuestion = aiResponse?.message || question;
            decision = RewriteDecision.COPY;
            rewriteResponse = {
                decision: RewriteDecision.COPY,
                rewritten: question,
                reason: 'json_parse_error',
                evidence: [],
            };
        }

        const defaultProps: CreateContextMessage = {
            fromInteractionId: null,
            workspaceId: agent.workspaceId,
            referenceId,
            contextId,
            nextStep: null,
            content: null,
            role: null,
            completionTokens: aiResponse.completionTokens || 0,
            promptTokens: aiResponse.promptTokens || 0,
            agentId: agent.id,
            isFallback: false,
            modelName: DEFAULT_AI_MODEL,
            type: ContextMessageType.rewrite,
        };

        if (rewriteQuestion !== question) {
            await this.contextMessageService.bulkCreate([
                {
                    ...defaultProps,
                    content: question,
                    role: ContextMessageRole.user,
                },
                {
                    ...defaultProps,
                    content: rewriteQuestion,
                    role: ContextMessageRole.system,
                },
            ]);
        }

        return {
            question: rewriteQuestion,
            decision,
        };
    }
}
