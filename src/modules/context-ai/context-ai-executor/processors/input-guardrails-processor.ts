import { Injectable } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import { ProcessingContext, ProcessingResult } from '../interfaces/conversation-processor.interface';
import { GuardrailsService } from '../../guardrails/guardrails.service';
import { SafeRegex } from '../../../../common/utils/safe-regex.util';

@Injectable()
export class InputGuardrailsProcessor extends BaseProcessor {
    private static readonly REGEX_OPTIONS = {
        timeout: 100,
        maxLength: 5000,
        context: 'InputGuardrails',
    };

    constructor(private readonly guardrailsService: GuardrailsService) {
        super(InputGuardrailsProcessor.name);
    }

    async canHandle(_context: ProcessingContext): Promise<boolean> {
        return true;
    }

    async process(context: ProcessingContext): Promise<ProcessingResult> {
        try {
            const securityCheck = this.validateInputSecurity(context.message);
            if (!securityCheck.isValid) {
                if (context.debug) {
                    this.logInfo(context, `Input bloqueado por segurança: ${securityCheck.reason}`);
                }

                return this.createStopResultWithAudio(
                    'Sua mensagem não pôde ser processada. Como posso ajudá-lo com informações sobre nossos serviços?',
                    false,
                    {
                        processorType: 'guardrails-security',
                        blocked: true,
                        violationType: 'input_security',
                        reason: securityCheck.reason,
                    },
                );
            }
            const guardrailResult = await this.guardrailsService.validateInput(
                context.message,
                {
                    agentId: context.agent.id,
                    workspaceId: context.workspaceId,
                    customParameters: context.parameters,
                },
                {
                    stopOnFirstViolation: true,
                    confidenceThreshold: 0.7,
                    verbose: context.debug,
                },
            );

            if (!guardrailResult.allowed) {
                if (context.debug) {
                    this.logInfo(
                        context,
                        `Guardrail violado: ${guardrailResult.reason} (${guardrailResult.failedValidator})`,
                    );
                }

                let responseMessage: string;

                if (guardrailResult.filteredContent) {
                    responseMessage = guardrailResult.filteredContent;
                } else if (guardrailResult.violationType) {
                    responseMessage = this.guardrailsService.getStandardResponseForViolation(
                        guardrailResult.violationType,
                    );
                } else {
                    responseMessage = this.getGenericBlockedMessage();
                }

                const shouldGenerateAudio = false;

                return this.createStopResultWithAudio(responseMessage, shouldGenerateAudio, {
                    processorType: 'guardrails',
                    blocked: true,
                    violationType: guardrailResult.violationType,
                    reason: guardrailResult.reason,
                    failedValidator: guardrailResult.failedValidator,
                    confidence: guardrailResult.confidence,
                    executedValidators: guardrailResult.executedValidators,
                });
            }

            return this.createContinueResult();
        } catch (error) {
            this.logError(context, 'Erro na validação de guardrails', error);
            return this.createContinueResult();
        }
    }

    private getGenericBlockedMessage(): string {
        const messages = [
            'Desculpe, não posso responder essa mensagem. Como posso ajudá-lo com informações sobre o hospital?',
            'Não consegui entender sua mensagem. Posso ajudar com outras informações?',
            'Não consegui interpretar sua mensagem. Quer que eu lhe traga informações sobre convênios disponíveis ou especialidades?',
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }

    async quickValidate(context: ProcessingContext): Promise<ProcessingResult> {
        try {
            const guardrailResult = await this.guardrailsService.quickValidate(context.message, {
                agentId: context.agent.id,
                workspaceId: context.workspaceId,
            });

            if (!guardrailResult.allowed) {
                const responseMessage = guardrailResult.violationType
                    ? this.guardrailsService.getStandardResponseForViolation(guardrailResult.violationType)
                    : this.getGenericBlockedMessage();

                const shouldGenerateAudio = false;

                return this.createStopResultWithAudio(responseMessage, shouldGenerateAudio, {
                    processorType: 'guardrails-quick',
                    blocked: true,
                    violationType: guardrailResult.violationType,
                    reason: guardrailResult.reason,
                    failedValidator: guardrailResult.failedValidator,
                    confidence: guardrailResult.confidence,
                });
            }

            return this.createContinueResult();
        } catch (error) {
            this.logError(context, 'Erro na validação rápida de guardrails', error);
            return this.createContinueResult();
        }
    }

    private validateInputSecurity(message: string): { isValid: boolean; reason?: string } {
        if (message.length > 2000) {
            return { isValid: false, reason: 'message_too_long' };
        }

        const suspiciousPatterns = [
            /\({50,}/, // Muitos parênteses abertos
            /\){50,}/, // Muitos parênteses fechados
            /\[{50,}/, // Muitos colchetes abertos
            /\]{50,}/, // Muitos colchetes fechados
            /\*{20,}/, // Muitos asteriscos seguidos
            /\+{20,}/, // Muitos símbolos + seguidos
            /\?{20,}/, // Muitos símbolos ? seguidos
            /\\{20,}/, // Muitas barras invertidas seguidas
        ];

        for (const pattern of suspiciousPatterns) {
            if (SafeRegex.test(pattern, message, InputGuardrailsProcessor.REGEX_OPTIONS)) {
                return { isValid: false, reason: 'suspicious_pattern_detected' };
            }
        }

        if (this.hasRegexInjectionAttempt(message)) {
            return { isValid: false, reason: 'regex_injection_attempt' };
        }

        return { isValid: true };
    }

    private hasRegexInjectionAttempt(message: string): boolean {
        const injectionPatterns = [
            /\(\.\*\)\+/, // (.*)+
            /\(\.\*\)\*/, // (.*)*
            /\(.+\)\+/, // (.+)+
            /\(.+\)\*/, // (.+)*
            /\(\?!/, // (?! - negative lookahead
            /\(\?=/, // (?= - positive lookahead
            /\(\?</, // (?< - lookbehind
            /\(\?>/, // (?> - atomic group
        ];

        return injectionPatterns.some((pattern) => SafeRegex.test(pattern, message, InputGuardrailsProcessor.REGEX_OPTIONS));
    }
}
