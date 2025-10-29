import { Injectable } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import { ProcessingContext, ProcessingResult, NextStep } from '../interfaces/conversation-processor.interface';
import { ToolRegistry } from '../../agent-tools/registry/tool-registry.service';
import { AiProviderService } from '../../ai-provider/ai.service';
import { DEFAULT_AI_MODEL } from '../enums/ai-models.enum';
import { Tool, ToolResult } from '../../agent-tools/interfaces/tool.interface';
import { SkillSessionService } from '../../agent-skills/skills/services/skill-session.service';
import { ContextSwitchDetectorService } from '../services/context-switch-detector.service';
import { HistoryManagerService } from '../services/history-manager.service';
import { SuggestedActionsService } from '../../conversational-agents/services/suggested-actions.service';

@Injectable()
export class ToolProcessor extends BaseProcessor {
    constructor(
        private readonly toolRegistry: ToolRegistry,
        private readonly aiProviderService: AiProviderService,
        private readonly skillSessionService: SkillSessionService,
        private readonly contextSwitchDetector: ContextSwitchDetectorService,
        private readonly historyManagerService: HistoryManagerService,
        private readonly suggestedActionsService: SuggestedActionsService,
    ) {
        super(ToolProcessor.name);
    }

    async canHandle(context: ProcessingContext): Promise<boolean> {
        try {
            const activeSession = await this.skillSessionService.getActiveSession(context.contextId);
            if (activeSession) {
                this.logger.log(
                    `[ToolProcessor] Active session found for ${context.contextId}: ${activeSession.skillName} (${activeSession.status})`,
                );
                return true;
            }

            const availableTools = await this.toolRegistry.getToolsForAgent(context.agent);
            return availableTools.length > 0;
        } catch (error) {
            this.logError(context, 'Erro ao verificar tools disponíveis', error);
            return false;
        }
    }

    async process(context: ProcessingContext): Promise<ProcessingResult> {
        try {
            const activeSession = await this.skillSessionService.getActiveSession(context.contextId);

            // Se há uma sessão ativa, verificar se usuário mudou de contexto
            if (activeSession) {
                this.logger.log(
                    `[ToolProcessor] Active session found: ${activeSession.skillName} (${activeSession.status})`,
                );

                // Buscar histórico para análise de contexto
                const historicMessages = await this.historyManagerService.getHistoryMessages({
                    agent: context.agent,
                    contextId: context.contextId,
                    limit: 3,
                });

                // Buscar tool ativa para pegar descrição
                const availableTools = await this.toolRegistry.getToolsForAgent(context.agent);
                const activeTool = availableTools.find((tool) => tool.name === activeSession.skillName);

                // Detectar se houve mudança de contexto
                const switchAnalysis = await this.contextSwitchDetector.detectContextSwitch({
                    activeSkillName: activeSession.skillName,
                    activeSkillDescription: activeTool?.description,
                    awaitingInput: activeSession.status,
                    newUserMessage: context.message,
                    historicMessages,
                });

                this.logger.log(
                    `[ToolProcessor] Context switch analysis: ${switchAnalysis.classification} (confidence: ${switchAnalysis.confidence})`,
                );

                // Se mudou de contexto com alta confiança, limpa a sessão
                if (switchAnalysis.isContextSwitch && switchAnalysis.confidence >= 0.75) {
                    this.logger.log(
                        `[ToolProcessor] Context switch detected! Clearing session and processing new intent. Reason: ${switchAnalysis.reason}`,
                    );

                    // Armazena informação sobre a transição para uso posterior
                    const hadCollectedData = Object.keys(activeSession.collectedData || {}).length > 0;

                    await this.skillSessionService.clearSession(context.contextId);

                    // Adiciona metadata sobre a transição
                    context.metadata = {
                        ...context.metadata,
                        contextSwitchDetected: true,
                        previousSkill: activeSession.skillName,
                        switchReason: switchAnalysis.reason,
                        hadCollectedData,
                    };

                    // Continua o fluxo normal para detectar nova intent
                    // (não retorna aqui, deixa o código seguir para detectar nova tool)
                } else if (switchAnalysis.isContinuation || switchAnalysis.isClarification) {
                    // Usuário está continuando no contexto ou pedindo esclarecimento
                    if (activeTool) {
                        this.logger.log(`[ToolProcessor] User continuing in context. Executing: ${activeTool.name}`);
                        return await this.executeTool(activeTool, context);
                    } else {
                        // Tool não encontrada, limpa sessão
                        this.logger.warn(
                            `[ToolProcessor] Active tool not found: ${activeSession.skillName}. Clearing session.`,
                        );
                        await this.skillSessionService.clearSession(context.contextId);
                    }
                } else {
                    // Confidence baixa ou ambíguo - por segurança, continua na skill ativa
                    if (activeTool) {
                        this.logger.log(
                            `[ToolProcessor] Ambiguous context (confidence: ${switchAnalysis.confidence}). Continuing with active tool.`,
                        );
                        return await this.executeTool(activeTool, context);
                    }
                }
            }

            // Fluxo normal: detecta nova intent
            const availableTools = await this.toolRegistry.getToolsForAgent(context.agent);
            if (!availableTools.length) {
                return this.createContinueResult();
            }

            const detectionResult = await this.detectToolWithLLM(availableTools, context.message);

            if (!detectionResult) {
                return this.createContinueResult();
            }

            return await this.executeTool(detectionResult.tool, context, detectionResult.detection);
        } catch (error) {
            this.logError(context, 'Erro no processamento de tools', error);
            return this.createContinueResult();
        }
    }

    private async detectToolWithLLM(
        availableTools: Tool[],
        userMessage: string,
    ): Promise<{ tool: Tool; detection: { confidence: number; reason?: string } } | null> {
        const startTime = process.hrtime.bigint();

        try {
            if (!availableTools.length) {
                return null;
            }

            const aiResponse = await this.aiProviderService.execute({
                prompt: this.buildToolDetectionPrompt(availableTools, userMessage),
                temperature: 0.1,
                model: DEFAULT_AI_MODEL,
                maxTokens: 150,
            });

            const response = aiResponse.message || '';
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;

            this.logger.log(
                `[Tool Detection] Input: "${userMessage}" → Output: "${response}" (${durationMs.toFixed(1)}ms)`,
            );

            const detection = this.parseToolDetectionResponse(response);

            if (detection.toolId && detection.confidence >= 0.7) {
                const detectedTool = availableTools.find((tool) => tool.id === detection.toolId);
                if (detectedTool) {
                    this.logger.log(
                        `[Tool Detection] Tool selecionada: ${detectedTool.name} (${detectedTool.type}, confidence: ${detection.confidence})`,
                    );
                    return {
                        tool: detectedTool,
                        detection: {
                            confidence: detection.confidence,
                            reason: detection.reason,
                        },
                    };
                }
            }

            this.logger.log(`[Tool Detection] Nenhuma tool detectada (confidence: ${detection.confidence})`);
            return null;
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            this.logger.error(`[Tool Detection] Erro na detecção por LLM (${durationMs.toFixed(1)}ms):`, error);
            return null;
        }
    }

    private buildToolDetectionPrompt(tools: Tool[], userMessage: string): string {
        const toolsInfo = tools.map((tool, index) => ({
            index,
            id: tool.id,
            name: tool.name,
            type: tool.type,
            description: tool.description,
            examples: tool.examples,
        }));

        return `
# Classificador de Tools para Chatbot de Saúde

Você é um sistema especializado em identificar qual tool deve ser executada com base na mensagem do usuário em um chatbot da área da saúde.

## Tools Disponíveis:

${toolsInfo
    .map(
        (tool) => `
**Tool ID: ${tool.id}**
- Tipo: ${tool.type === 'action' ? 'ACTION (executa ação)' : 'INTENT (detecta intenção)'}
- Nome: ${tool.name}
- Descrição: ${tool.description}

**Exemplos positivos (devem ativar):**
${tool.examples.positive.map((ex) => `  ✅ "${ex}"`).join('\n')}

${
    tool.examples.negative.length > 0
        ? `**Exemplos negativos (NÃO devem ativar):**\n${tool.examples.negative.map((ex) => `  ❌ "${ex}"`).join('\n')}`
        : ''
}
`,
    )
    .join('\n---\n')}

## Instruções:

1. Analise cuidadosamente a mensagem do usuário
2. Compare com os exemplos específicos de cada tool
3. Considere sinônimos, variações e contexto típico da área da saúde
4. Avalie o nível de confiança da sua identificação (0.0 a 1.0)
5. **APENAS** retorne tools com confiança >= 0.7
6. Se uma tool se adequa com alta confiança, retorne: {"toolId": "ID", "confidence": 0.X, "reason": "motivo"}
7. Se nenhuma tool atinge confiança >= 0.7, retorne: {"toolId": null, "confidence": 0.0}
8. **NÃO** adicione explicações ou texto adicional além do JSON

## Critérios de Confiança:

- **0.9-1.0**: Correspondência exata ou quase exata com exemplos positivos
- **0.8-0.89**: Correspondência forte com sinônimos dos exemplos
- **0.7-0.79**: Correspondência razoável com contexto relacionado
- **<0.7**: Incerto, ambíguo, ou similar aos exemplos negativos

## Regras Especiais:

- Cumprimentos, saudações e conversa casual → {"toolId": null, "confidence": 0.0}
- Dúvidas gerais sobre saúde sem ação específica → {"toolId": null, "confidence": 0.0}

## Diferença entre ACTION e INTENT tools:

- **ACTION tools**: Executam operações diretas (listar médicos, consultar agendamentos)
- **INTENT tools**: Apenas detectam intenção para o sistema responder conversacionalmente

Texto do usuário para análise: "${userMessage}"

Resposta (formato JSON válido):`;
    }

    private parseToolDetectionResponse(response: string): {
        toolId: string | null;
        confidence: number;
        reason?: string;
    } {
        try {
            const cleanResponse = response.trim();

            if (cleanResponse === 'null' || cleanResponse === '') {
                return { toolId: null, confidence: 0.0 };
            }

            const parsed = JSON.parse(cleanResponse);
            if (parsed && typeof parsed === 'object') {
                return {
                    toolId: parsed.toolId || null,
                    confidence: parsed.confidence || 0.0,
                    reason: parsed.reason,
                };
            }

            return { toolId: null, confidence: 0.0 };
        } catch (error) {
            this.logger.error('[Tool Detection] Erro ao parsear resposta:', error);
            return { toolId: null, confidence: 0.0 };
        }
    }

    private isToolResult(result: unknown): result is ToolResult {
        return result !== null && typeof result === 'object';
    }

    private hasNextStep(result: ToolResult): result is ToolResult & { nextStep: NonNullable<ToolResult['nextStep']> } {
        return 'nextStep' in result && result.nextStep !== undefined && result.nextStep !== null;
    }

    private hasMessage(result: ToolResult): result is ToolResult & { message: string } {
        return 'message' in result && typeof result.message === 'string';
    }

    private async executeTool(
        tool: Tool,
        context: ProcessingContext,
        detection?: { confidence: number; reason?: string },
    ): Promise<ProcessingResult> {
        const startTime = process.hrtime.bigint();

        try {
            if (context.debug) {
                this.logInfo(context, `Executando tool: ${tool.name} (${tool.type})`);
            }

            this.logger.log(
                `[ToolProcessor] Executing tool ${tool.name} (${tool.type}) for contextId: ${context.contextId}`,
            );

            const historyMessages = await this.historyManagerService.getHistoryMessages({
                agent: context.agent,
                contextId: context.contextId,
                limit: 5,
            });

            const conversationHistory = historyMessages.map((msg) => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content,
            }));

            const toolResult = await tool.execute(context.agent, {
                contextId: context.contextId,
                message: context.message,
                referenceId: context.referenceId,
                conversationHistory,
            });

            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number(endTime - startTime) / 1_000_000;

            if (tool.type === 'intent' && this.isToolResult(toolResult) && this.hasNextStep(toolResult)) {
                const nextStep = toolResult.nextStep;

                if (nextStep.treeImmediately) {
                    return this.createStopResultWithAudio(
                        null,
                        false,
                        {
                            processorType: 'tool',
                            toolName: tool.name,
                            toolId: tool.id,
                            toolType: 'intent',
                            detectedIntent: tool.name,
                            executionTimeMs,
                            hasResponseContent: false,
                            detectionConfidence: detection?.confidence,
                            detectionReason: detection?.reason,
                            reason: `Detected intent: ${tool.name} - ${tool.description}`,
                        },
                        nextStep,
                    );
                }

                this.logger.log(
                    `[ToolProcessor] Intent tool detectada, passando nextStep para RAG (${executionTimeMs.toFixed(
                        1,
                    )}ms)`,
                );
                return this.createContinueResult({
                    nextStep,
                    detectedIntent: tool.name,
                    toolType: 'intent',
                    executionTimeMs,
                });
            }

            if (this.isToolResult(toolResult) && this.hasMessage(toolResult)) {
                const shouldGenerateAudio = false;

                let nextStep: NextStep | undefined;
                if (toolResult.suggestedActions) {
                    const normalizedActions = this.suggestedActionsService.normalize(toolResult.suggestedActions);
                    if (normalizedActions) {
                        nextStep = {
                            suggestedActions: normalizedActions,
                        };
                    }
                }

                return this.createStopResultWithAudio(
                    toolResult.message,
                    shouldGenerateAudio,
                    {
                        processorType: 'tool',
                        toolName: tool.name,
                        toolId: tool.id,
                        toolType: 'action',
                        toolData: toolResult,
                        requiresInput: toolResult.requiresInput,
                        executionTimeMs,
                        reason: `Executed tool: ${tool.name}`,
                    },
                    nextStep,
                );
            }

            if (toolResult && (Array.isArray(toolResult) || typeof toolResult === 'object')) {
                const prompt = tool.generatePrompt
                    ? tool.generatePrompt(toolResult, context.message, conversationHistory)
                    : `Dados retornados pela tool ${tool.name}: ${JSON.stringify(toolResult)}`;

                const llmStartTime = process.hrtime.bigint();
                const aiResponse = await this.aiProviderService.execute({
                    prompt,
                    temperature: 0.7,
                    model: DEFAULT_AI_MODEL,
                    maxTokens: 1_024,
                });

                const llmEndTime = process.hrtime.bigint();
                const llmTimeMs = Number(llmEndTime - llmStartTime) / 1_000_000;
                const totalTimeMs = Number(llmEndTime - startTime) / 1_000_000;

                const shouldGenerateAudio = false;
                return this.createStopResultWithAudio(aiResponse.message, shouldGenerateAudio, {
                    processorType: 'tool',
                    toolName: tool.name,
                    toolId: tool.id,
                    toolType: 'action',
                    toolData: toolResult,
                    promptTokens: aiResponse.promptTokens,
                    completionTokens: aiResponse.completionTokens,
                    executionTimeMs,
                    llmTimeMs,
                    totalTimeMs,
                    reason: `Executed tool: ${tool.name} - ${tool.description}`,
                });
            }

            return this.createContinueResult();
        } catch (toolError) {
            this.logError(context, `Erro na execução da tool ${tool.name}`, toolError);
            return this.createContinueResult();
        }
    }
}
