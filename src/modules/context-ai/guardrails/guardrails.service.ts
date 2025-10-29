import { Injectable, Logger } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from './interfaces/guardrail.interface';
import { SexualContentValidator } from './validators/sexual-content-validator';
import { PromptInjectionValidator } from './validators/prompt-injection-validator';
import { BlacklistedWordsValidator } from './validators/blacklisted-words-validator';
import { MedicalAdviceValidator } from './validators/medical-advice-validator';
import { ExcessiveRepetitionValidator } from './validators/excessive-repetition-validator';
import { HtmlContentValidator } from './validators/html-content-validator';

export interface GuardRailsResult {
    allowed: boolean;
    reason?: string;
    violationType?: GuardrailViolationType;
    confidence: number;
    failedValidator?: string;
    filteredContent?: string;
    executedValidators: string[];
}

export interface GuardRailsConfig {
    stopOnFirstViolation?: boolean;
    confidenceThreshold?: number;
    enabledValidators?: string[];
    verbose?: boolean;
}

interface ValidatorWithPriority {
    validator: GuardrailValidator;
    priority: number;
}

@Injectable()
export class GuardrailsService {
    private readonly logger = new Logger(GuardrailsService.name);
    private readonly validators: ValidatorWithPriority[] = [];

    constructor(
        private readonly sexualContentValidator: SexualContentValidator,
        private readonly promptInjectionValidator: PromptInjectionValidator,
        private readonly blacklistedWordsValidator: BlacklistedWordsValidator,
        private readonly medicalAdviceValidator: MedicalAdviceValidator,
        private readonly excessiveRepetitionValidator: ExcessiveRepetitionValidator,
        private readonly htmlContentValidator: HtmlContentValidator,
    ) {
        this.initializeValidators();
    }

    private initializeValidators(): void {
        this.validators.push(
            { validator: this.htmlContentValidator, priority: 0 },
            { validator: this.excessiveRepetitionValidator, priority: 1 },
            { validator: this.promptInjectionValidator, priority: 2 },
            { validator: this.sexualContentValidator, priority: 3 },
            { validator: this.medicalAdviceValidator, priority: 3 },
            { validator: this.blacklistedWordsValidator, priority: 4 },
        );

        this.validators.sort((a, b) => a.priority - b.priority);
    }

    async validateInput(
        input: string,
        context?: GuardrailContext,
        config: GuardRailsConfig = {},
    ): Promise<GuardRailsResult> {
        const {
            stopOnFirstViolation = true,
            confidenceThreshold = 0.7,
            enabledValidators = [],
            verbose = false,
        } = config;

        if (!input || input.trim().length === 0) {
            return {
                allowed: false,
                reason: 'Input vazio não é permitido',
                confidence: 1.0,
                executedValidators: [],
            };
        }

        const executedValidators: string[] = [];
        const results: GuardrailResult[] = [];

        const validatorsToRun = this.getEnabledValidators(enabledValidators);

        for (const validatorWithPriority of validatorsToRun) {
            const validator = validatorWithPriority.validator;
            try {
                const result = await validator.validate(input, context);
                results.push(result);
                executedValidators.push(validator.name);

                if (!result.allowed && result.confidence >= confidenceThreshold) {
                    if (verbose) {
                        this.logger.warn(`Validator ${validator.name} blocked input: ${result.reason}`);
                    }

                    return {
                        allowed: false,
                        reason: result.reason,
                        violationType: result.violationType,
                        confidence: result.confidence,
                        failedValidator: validator.name,
                        filteredContent: result.filteredContent,
                        executedValidators,
                    };
                }

                if (stopOnFirstViolation && !result.allowed) {
                    break;
                }
            } catch (error) {
                this.logger.error(`Error in validator ${validator.name}:`, error);
            }
        }

        const avgConfidence =
            results.length > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length : 1.0;

        return {
            allowed: true,
            confidence: avgConfidence,
            executedValidators,
        };
    }

    async validateWithSpecificGuardrails(
        input: string,
        validatorNames: string[],
        context?: GuardrailContext,
    ): Promise<GuardRailsResult> {
        return this.validateInput(input, context, {
            enabledValidators: validatorNames,
            stopOnFirstViolation: true,
            verbose: true,
        });
    }

    async quickValidate(input: string, context?: GuardrailContext): Promise<GuardRailsResult> {
        return this.validateInput(input, context, {
            enabledValidators: ['prompt-injection', 'sexual-content'],
            stopOnFirstViolation: true,
            confidenceThreshold: 0.8,
        });
    }

    async fullValidate(input: string, context?: GuardrailContext): Promise<GuardRailsResult> {
        return this.validateInput(input, context, {
            stopOnFirstViolation: false,
            confidenceThreshold: 0.7,
            verbose: true,
        });
    }

    private getEnabledValidators(enabledValidators: string[] = []): ValidatorWithPriority[] {
        let validatorsToRun = this.validators.filter((v) => v.validator.enabled);

        if (enabledValidators.length > 0) {
            validatorsToRun = validatorsToRun.filter((v) => enabledValidators.includes(v.validator.name));
        }

        return validatorsToRun;
    }

    getStandardResponseForViolation(violationType: GuardrailViolationType): string {
        const standardResponses: Record<GuardrailViolationType, string[]> = {
            [GuardrailViolationType.SEXUAL_CONTENT]: [
                'Entendi sua mensagem, mas não posso responder a esse tipo de conteúdo. Quer que eu te ajude com informações do hospital?',
                'Ops, não consigo seguir por esse caminho. Que tal falarmos sobre exames, horários ou convênios?',
            ],
            [GuardrailViolationType.PROMPT_INJECTION]: [
                'Desculpe, não consegui processar essa solicitação. Posso te ajudar com detalhes sobre nossos serviços?',
                'Não posso continuar com esse tipo de instrução, mas estou aqui para ajudar com informações sobre o hospital.',
                'Essa solicitação não faz parte do que consigo responder. Quer ver opções de exames, médicos ou convênios?',
            ],
            [GuardrailViolationType.TOXIC_LANGUAGE]: [
                'Por favor, vamos conversar de forma cordial. Quer que eu te traga informações sobre agendamentos, serviços ou outras informações úteis do hospital?',
            ],
            [GuardrailViolationType.MEDICAL_ADVICE]: [
                'Não consigo fornecer conselhos médicos. Para isso, é importante falar com um profissional de saúde.',
                'Orientações médicas precisam ser dadas por especialistas. Mas posso te ajudar com informações do hospital.',
                'Não posso substituir um médico, mas posso trazer dados sobre especialidades, horários e serviços do hospital.',
            ],
            [GuardrailViolationType.OFF_TOPIC]: [
                'Vamos manter o foco no hospital, combinado? Posso te ajudar com consultas ou exames.',
                'Esse assunto foge um pouco do que consigo responder. Quer falar sobre nossos serviços de saúde?',
                'Desculpe, só consigo responder sobre o hospital. Posso te mostrar informações de especialidades e convênios.',
            ],
            [GuardrailViolationType.BLACKLISTED_WORDS]: [
                'Essa mensagem não pode ser processada. Mas posso ajudar com informações do hospital.',
                'Infelizmente não consegui seguir com essa mensagem. Quer falar sobre consultas, exames ou médicos?',
                'Não posso responder dessa forma, mas estou aqui para apoiar com informações sobre nossos serviços.',
            ],
            [GuardrailViolationType.EXCESSIVE_REPETITION]: [
                'Percebi que sua mensagem tem muitos caracteres repetidos. Pode reformular sua pergunta?',
                'Sua mensagem parece ter caracteres em excesso. Como posso ajudá-lo com informações sobre o hospital?',
                'Detectei repetições excessivas na mensagem. Quer tentar novamente de forma mais clara?',
            ],
            [GuardrailViolationType.MAX_LENGTH]: [
                'Sua mensagem é muito longa. Conseguiu reorganizar as informações de forma mais concisa?',
                'Mensagem muito extensa. Pode resumir o que precisa saber sobre o hospital?',
                'Por favor, tente ser mais breve. Como posso ajudá-lo com informações específicas?',
            ],
            [GuardrailViolationType.HTML_CONTENT]: [
                'Desculpe, não consegui processar essa solicitação. Posso te ajudar com detalhes sobre nossos serviços?',
                'Não posso continuar com esse tipo de instrução, mas estou aqui para ajudar com informações sobre o hospital.',
                'Essa solicitação não faz parte do que consigo responder. Quer ver opções de exames, médicos ou convênios?',
            ],
        };

        const responses = standardResponses[violationType];
        if (!responses) {
            return 'Desculpe, não posso processar essa solicitação. Posso te ajudar com informações sobre o hospital.';
        }

        return responses[Math.floor(Math.random() * responses.length)];
    }
}
