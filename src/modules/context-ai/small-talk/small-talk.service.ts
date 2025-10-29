import { Injectable, Logger } from '@nestjs/common';
import { IAgent } from '../agent/interfaces/agent.interface';
import { DoQuestionParameters } from '../context-ai-executor/interfaces/do-question.interface';
import { SessionStateService } from '../context-ai-executor/services/session-state.service';
import { IntentClassifierService } from './services/intent-classifier.service';
import { ResponseGeneratorService } from './services/response-generator.service';
import { ResponseContextBuilderService } from './services/response-context-builder.service';

interface InterceptSmallTalkParams {
    agent: IAgent;
    userMessage: string;
    customVariables?: DoQuestionParameters;
    contextId: string;
}

@Injectable()
export class SmallTalkService {
    private readonly logger = new Logger(SmallTalkService.name);

    constructor(
        private readonly intentClassifier: IntentClassifierService,
        private readonly responseGenerator: ResponseGeneratorService,
        private readonly contextBuilder: ResponseContextBuilderService,
        private readonly sessionStateService: SessionStateService,
    ) {}

    async interceptSmallTalk(params: InterceptSmallTalkParams): Promise<string | null> {
        const { agent, userMessage, customVariables, contextId } = params;

        try {
            const hasActiveConversationalAgent = await this.sessionStateService.hasActiveConversationalAgent(contextId);
            if (hasActiveConversationalAgent) {
                this.logger.log(`[SmallTalk] Input: "${userMessage}" → skipped (conversational agent active)`);
                return null;
            }

            const isWaitingForClarification = await this.sessionStateService.isWaitingForClarification(contextId);
            if (isWaitingForClarification) {
                this.logger.log(`[SmallTalk] Input: "${userMessage}" → skipped (answering clarification)`);
                return null;
            }

            const regexClassification = this.intentClassifier.classifyWithRegex(userMessage);

            if (regexClassification) {
                this.logger.log(
                    `[SmallTalk] Input: "${userMessage}" → ${regexClassification.type}:${regexClassification.confidence} (regex)`,
                );
                const context = await this.contextBuilder.build(agent, customVariables);
                return await this.responseGenerator.generateResponse(
                    regexClassification.type,
                    userMessage,
                    context,
                );
            }

            const context = await this.contextBuilder.build(agent, customVariables);
            const llmResult = await this.intentClassifier.classifyAndGenerateWithLLM(userMessage, context);

            if (llmResult) {
                this.logger.log(
                    `[SmallTalk] Input: "${userMessage}" → ${llmResult.intentType}:${llmResult.confidence} (llm-unified)`,
                );
                return llmResult.response;
            }

            this.logger.log(`[SmallTalk] Input: "${userMessage}" → none:0 (no match)`);
            return null;
        } catch (error) {
            this.logger.error('Erro ao interceptar mensagem:', error);
            return null;
        }
    }
}
