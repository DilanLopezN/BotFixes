import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../../ai-provider/ai.service';
import { AiModel } from '../../context-ai-executor/enums/ai-models.enum';
import { IntentType } from '../enums/intent-type.enum';
import {
    IntentClassification,
    LLMIntentResponse,
    ClassifyAndGenerateResult,
} from '../interfaces/intent-classification.interface';
import { ResponseContext } from '../interfaces/response-context.interface';
import { INTENT_PATTERNS } from '../configs/intent-patterns.config';
import { SmallTalkPromptBuilder } from '../builders/small-talk-prompt.builder';
import { isOnlyEmojis } from '../../../../common/utils/isOnlyOneEmoji';
import { SafeRegex } from '../../../../common/utils/safe-regex.util';

@Injectable()
export class IntentClassifierService {
    private readonly logger = new Logger(IntentClassifierService.name);
    private static readonly REGEX_OPTIONS = {
        timeout: 50,
        maxLength: 1000,
        context: 'SmallTalk',
    };

    constructor(
        private readonly aiProviderService: AiProviderService,
        private readonly smallTalkPromptBuilder: SmallTalkPromptBuilder,
    ) {}

    classifyWithRegex(userMessage: string): IntentClassification | null {
        const normalizedMessage = userMessage.trim();

        if (normalizedMessage.length > IntentClassifierService.REGEX_OPTIONS.maxLength) {
            return null;
        }

        if (isOnlyEmojis(normalizedMessage) && !this.containsNumbers(normalizedMessage)) {
            return {
                type: IntentType.EMOJI,
                confidence: 1.0,
                needsLLM: false,
            };
        }

        for (const intentPattern of INTENT_PATTERNS) {
            for (const pattern of intentPattern.patterns) {
                if (SafeRegex.test(pattern, normalizedMessage, IntentClassifierService.REGEX_OPTIONS)) {
                    return {
                        type: intentPattern.intentType,
                        confidence: 1.0,
                        needsLLM: false,
                    };
                }
            }
        }

        return null;
    }

    async classifyAndGenerateWithLLM(
        userMessage: string,
        context: ResponseContext,
    ): Promise<ClassifyAndGenerateResult | null> {
        try {
            const prompt = this.smallTalkPromptBuilder.build(userMessage, context);

            const aiResponse = await this.aiProviderService.execute({
                prompt,
                temperature: 0.7,
                model: AiModel.GPT_4_1_MINI,
                maxTokens: 200,
            });

            const response = aiResponse.message || '';

            const jsonMatch = response.match(/\{[^}]*"type"[^}]*\}/);
            if (!jsonMatch) {
                this.logger.error(`[LLM-Unified] No JSON found in response: "${response}"`);
                return null;
            }

            let classification: LLMIntentResponse;
            try {
                classification = JSON.parse(jsonMatch[0]);
            } catch (jsonError) {
                this.logger.error(`[LLM-Unified] Invalid JSON: "${jsonMatch[0]}"`, jsonError);
                return null;
            }

            if (!classification.type || classification.type === 'none' || classification.confidence < 0.5) {
                return null;
            }

            const intentType = this.stringToIntentType(classification.type);
            if (!intentType) {
                this.logger.warn(`[LLM-Unified] Unknown intent type: "${classification.type}"`);
                return null;
            }

            const generatedResponse = response.replace(jsonMatch[0], '').trim();

            if (!generatedResponse || generatedResponse.length < 10) {
                this.logger.warn(`[LLM-Unified] Response too short: "${generatedResponse}"`);
                return null;
            }

            return {
                intentType,
                confidence: classification.confidence,
                response: generatedResponse,
            };
        } catch (error) {
            this.logger.error('[LLM-Unified] Erro:', error);
            return null;
        }
    }

    private containsNumbers(text: string): boolean {
        return SafeRegex.test(/\d/, text, IntentClassifierService.REGEX_OPTIONS);
    }

    private stringToIntentType(type: string): IntentType | null {
        const mapping: Record<string, IntentType> = {
            greeting: IntentType.GREETING,
            thanks: IntentType.THANKS,
            farewell: IntentType.FAREWELL,
            menu: IntentType.MENU,
            off_topic: IntentType.OFF_TOPIC,
            end_service: IntentType.END_SERVICE,
            emoji: IntentType.EMOJI,
            none: IntentType.NONE,
        };
        return mapping[type] || null;
    }
}
