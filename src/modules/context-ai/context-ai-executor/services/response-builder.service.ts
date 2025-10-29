import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { ExecuteResponse, ResponseType } from '../interfaces/context-execute.interface';
import { CreateContextMessage } from '../../context-message/interfaces/create-context-message.interface';
import { ContextMessageRole, ContextMessageType } from '../../context-message/interfaces/context-message.interface';
import { IntentDetectionService } from '../../intent-detection/services/intent-detection.service';
import { AudioGenerationService } from './audio-generation.service';
import { ContextMessagePersistenceService } from './context-message-persistence.service';
import { DoQuestionErrorCode, ERROR_MESSAGES } from '../enums/error-codes.enum';
import { DEFAULT_AI_MODEL } from '../enums/ai-models.enum';
import { BuildResponseParams } from '../interfaces/build-response.interface';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { ProcessorType } from '../interfaces/conversation-processor.interface';
import { TransitionMessageService } from './transition-message.service';

@Injectable()
export class ResponseBuilderService {
    constructor(
        private readonly intentDetectionService: IntentDetectionService,
        private readonly audioGenerationService: AudioGenerationService,
        private readonly messagePersistenceService: ContextMessagePersistenceService,
        private readonly contextVariableService: ContextVariableService,
        private readonly transitionMessageService: TransitionMessageService,
    ) {
        this.registerHandlebarsHelpers();
    }

    public async buildResponse(params: BuildResponseParams): Promise<DefaultResponse<ExecuteResponse>> {
        const { result, agent, data, contextVariables, referenceId, debug } = params;
        const defaultResponse: DefaultResponse<ExecuteResponse> = {
            data: {
                message: null,
                variables: contextVariables,
                responseType: this.determineResponseType(result),
                traceId: result.traceId,
            },
            metadata: null,
        };

        // Verifica se o processador indicou explicitamente que não há conteúdo de resposta
        // mas o processamento foi bem-sucedido (ex: TREE_IMMEDIATELY, webhooks, etc)
        const hasResponseContent = result.metadata?.hasResponseContent !== false;

        // Só retorna erro se não tem conteúdo E deveria ter (processador não disse que é esperado)
        if (!result.content && hasResponseContent) {
            return {
                data: {
                    errorCode: DoQuestionErrorCode.NO_PROCESSORS_HANDLED,
                    error: true,
                    errorMessage: ERROR_MESSAGES[DoQuestionErrorCode.NO_PROCESSORS_HANDLED],
                    message: null,
                    variables: contextVariables,
                },
            };
        }

        const defaultModelName = DEFAULT_AI_MODEL;
        const defaultProps: CreateContextMessage = {
            fromInteractionId: data.fromInteractionId,
            workspaceId: agent.workspaceId,
            referenceId,
            contextId: data.contextId,
            nextStep: result.nextStep,
            content: null,
            role: null,
            completionTokens: result.metadata?.tokenUsage?.completionTokens || 0,
            promptTokens: result.metadata?.tokenUsage?.promptTokens || 0,
            agentId: agent.id,
            isFallback: result.metadata?.isFallback || false,
            modelName: defaultModelName,
            type: ContextMessageType.message,
        };

        const finalMessage = result.metadata?.rewrittenContext?.message || data.question;

        // Se não há conteúdo de resposta, persiste apenas a mensagem do usuário
        if (!hasResponseContent) {
            await this.messagePersistenceService.bulkCreateAndCache([
                {
                    ...defaultProps,
                    content: finalMessage,
                    role: ContextMessageRole.user,
                    completionTokens: 0,
                },
            ]);
            // message permanece null para indicar que não há resposta textual
        } else {
            // Fluxo normal: persiste mensagem do sistema e do usuário
            let responseContent = result.content;

            // Adiciona mensagem de transição se houve mudança de contexto
            if (result.metadata?.contextSwitchDetected && result.metadata?.previousSkill) {
                const transitionMessage = await this.transitionMessageService.generateTransitionMessage({
                    previousSkill: result.metadata.previousSkill,
                    newUserMessage: finalMessage,
                    hadCollectedData: result.metadata.hadCollectedData || false,
                    switchReason: result.metadata.switchReason,
                });

                if (transitionMessage) {
                    responseContent = this.transitionMessageService.prependTransitionMessage(
                        transitionMessage,
                        result.content,
                    );
                }
            }

            // Concatena a mensagem de boas-vindas se for a mensagem inicial
            // e se a resposta veio de RAG ou Rewrite (não do SmallTalk ou outros processadores)
            const shouldAddWelcome =
                data.isStartMessage &&
                (result.metadata?.processorType === ProcessorType.RAG ||
                    result.metadata?.processorType === ProcessorType.QUESTION_REWRITE);

            if (shouldAddWelcome) {
                const welcomeMessage = await this.generateWelcomeMessage(agent, data.parameters);
                if (welcomeMessage) {
                    responseContent = `${welcomeMessage}\n\n${result.content}`;
                }
            }

            const [, createdMessage] = await this.messagePersistenceService.bulkCreateAndCache([
                {
                    ...defaultProps,
                    content: finalMessage,
                    role: ContextMessageRole.user,
                    completionTokens: 0,
                },
                {
                    ...defaultProps,
                    content: responseContent,
                    role: ContextMessageRole.system,
                },
            ]);

            defaultResponse.data.message = createdMessage;
        }

        if (result.nextStep?.intent) {
            const { actions, detectedIntent, interaction } = await this.intentDetectionService.getIntentDetectionById(
                agent.workspaceId,
                result.nextStep.intent,
                agent.id,
            );

            defaultResponse.data.intent = {
                actions,
                detectedIntent: detectedIntent || null,
                interaction: interaction || null,
            };

            defaultResponse.data.nextStep = result.nextStep;
        }

        if (result.audioRequest?.shouldGenerateAudio && result.content) {
            const audioResult = await this.audioGenerationService.generateAudioIfNeeded(
                {
                    text: result.content,
                    agent,
                    contextId: data.contextId,
                    shouldGenerateAudio: result.audioRequest.shouldGenerateAudio,
                    fromAudio: data.fromAudio,
                },
                debug,
            );

            if (audioResult.isAudio) {
                defaultResponse.data.isAudio = true;
                defaultResponse.data.audioUrl = audioResult.audioUrl;
            }
        }

        return defaultResponse;
    }

    private determineResponseType(result: any): ResponseType {
        if (result.metadata?.isClarification) {
            return ResponseType.CLARIFY;
        }

        if (result.metadata?.isFallback) {
            return ResponseType.FALLBACK;
        }

        if (result.nextStep?.intent || result.metadata?.processorType === ProcessorType.TOOL) {
            return ResponseType.TOOL_EXECUTION;
        }

        if (!result.content && result.metadata?.hasResponseContent !== false) {
            return ResponseType.ERROR;
        }

        return ResponseType.COMPLETED;
    }

    private async generateWelcomeMessage(agent: any, customVariables?: any): Promise<string | null> {
        try {
            const welcomeTemplates = [
                '👋 {{#ifExists patientName}}Olá, {{patientName}}!{{else}}Olá!{{/ifExists}} Seja bem-vindo(a) ao {{clientName}}.\n\nSou *{{botName}}*, assistente virtual do hospital. Em que posso lhe ajudar? 🙂',
                '👋 {{#ifExists patientName}}Oi, {{patientName}}!{{else}}Oi!{{/ifExists}} É um prazer recebê-lo(a) no {{clientName}}.\n\nSou *{{botName}}*, assistente virtual do hospital e estou aqui para auxiliar. 🙂',
                '👋 {{#ifExists patientName}}Olá, {{patientName}}!{{else}}Olá!{{/ifExists}} Seja muito bem-vindo(a) ao {{clientName}}.\n\nSou *{{botName}}*, assistente virtual do hospital e estou aqui para te auxiliar. 🙂',
            ];

            const randomIndex = Math.floor(Math.random() * welcomeTemplates.length);
            const templateToUse = welcomeTemplates[randomIndex];

            const variables = await this.contextVariableService.listVariablesFromAgent({
                workspaceId: agent.workspaceId,
                agentId: agent.id,
            });

            const context = this.buildTemplateContext(variables, customVariables);
            return Handlebars.compile(templateToUse)(context);
        } catch (error) {
            return null;
        }
    }

    private buildTemplateContext(variables: any[], customVariables?: any): { [key: string]: any } {
        const context: { [key: string]: string } = {};

        variables.forEach((variable) => (context[variable.name] = variable.value));

        if (customVariables?.paciente_nome) {
            context.patientName = customVariables.paciente_nome;
        }

        return context;
    }

    private registerHandlebarsHelpers(): void {
        if (!Handlebars.helpers.ifExists) {
            Handlebars.registerHelper('ifExists', function (variable, options) {
                if (variable && variable !== null && variable !== undefined && variable !== '') {
                    return options.fn(this);
                }
                return options.inverse(this);
            });
        }
    }
}
