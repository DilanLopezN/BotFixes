import { Injectable } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import { ProcessingContext, ProcessingResult } from '../interfaces/conversation-processor.interface';
import { ConversationalAgentRegistry } from '../../conversational-agents/services/conversational-agent-registry.service';
import { ConversationContextService } from '../../conversational-agents/services/conversation-context.service';
import { SuggestedActionsService } from '../../conversational-agents/services/suggested-actions.service';
import {
    ConversationState,
    ConversationalAgent,
} from '../../conversational-agents/interfaces/conversational-agent.interface';
import { ContextSwitchDetectorService } from '../services/context-switch-detector.service';
import { HistoryManagerService } from '../services/history-manager.service';
import { SessionStateService } from '../services/session-state.service';
import { SkillSessionService } from '../../agent-skills/skills/services/skill-session.service';

@Injectable()
export class ConversationalAgentProcessor extends BaseProcessor {
    constructor(
        private readonly agentRegistry: ConversationalAgentRegistry,
        private readonly conversationContextService: ConversationContextService,
        private readonly suggestedActionsService: SuggestedActionsService,
        private readonly contextSwitchDetector: ContextSwitchDetectorService,
        private readonly historyManagerService: HistoryManagerService,
        private readonly sessionStateService: SessionStateService,
        private readonly skillSessionService: SkillSessionService,
    ) {
        super(ConversationalAgentProcessor.name);
    }

    async canHandle(context: ProcessingContext): Promise<boolean> {
        try {
            const activeSkillSession = await this.skillSessionService.getActiveSession(context.contextId);
            if (activeSkillSession) {
                this.logger.log(
                    `[ConversationalAgentProcessor] Active skill session found (${activeSkillSession.skillName}), deferring to ToolProcessor`,
                );
                return false;
            }

            const activeConversation = await this.conversationContextService.getContext(context.contextId);
            if (activeConversation) {
                this.logger.log(
                    `[ConversationalAgentProcessor] Active conversation found: ${activeConversation.agentId} (${activeConversation.state})`,
                );
                return true;
            }

            const bestAgent = await this.agentRegistry.findBestAgent(context.message);
            if (bestAgent) {
                this.logger.log(`[ConversationalAgentProcessor] Found agent: ${bestAgent.id} for message`);
                return true;
            }

            return false;
        } catch (error) {
            this.logError(context, 'Erro ao verificar conversational agents', error);
            return false;
        }
    }

    async process(context: ProcessingContext): Promise<ProcessingResult> {
        const startTime = process.hrtime.bigint();

        try {
            let conversationContext = await this.conversationContextService.getContext(context.contextId);
            let agent: ConversationalAgent | undefined;

            if (conversationContext) {
                agent = this.agentRegistry.getAgentById(conversationContext.agentId);

                if (!agent) {
                    this.logger.warn(`Agent ${conversationContext.agentId} not found, clearing conversation context`);
                    await this.conversationContextService.clearContext(context.contextId);
                    return this.createContinueResult();
                }

                this.logger.log(
                    `[ConversationalAgentProcessor] Active conversation found: ${agent.id} (${conversationContext.state})`,
                );

                const historicMessages = await this.historyManagerService.getHistoryMessages({
                    agent: context.agent,
                    contextId: context.contextId,
                    limit: 3,
                });

                const switchAnalysis = await this.contextSwitchDetector.detectContextSwitch({
                    activeSkillName: agent.name,
                    activeSkillDescription: agent.description,
                    awaitingInput: conversationContext.state,
                    newUserMessage: context.message,
                    historicMessages,
                });

                this.logger.log(
                    `[ConversationalAgentProcessor] Context switch analysis: ${switchAnalysis.classification} (confidence: ${switchAnalysis.confidence})`,
                );

                if (switchAnalysis.isContextSwitch && switchAnalysis.confidence >= 0.75) {
                    this.logger.log(
                        `[ConversationalAgentProcessor] Context switch detected! Clearing conversation and checking for new agent. Reason: ${switchAnalysis.reason}`,
                    );

                    await this.conversationContextService.clearContext(context.contextId);
                    await this.sessionStateService.clearConversationalAgentState(context.contextId);

                    const newAgent = await this.agentRegistry.findBestAgent(context.message);

                    if (newAgent) {
                        this.logger.log(
                            `[ConversationalAgentProcessor] Found new agent after context switch: ${newAgent.id}`,
                        );
                        agent = newAgent;
                        conversationContext = undefined;
                    } else {
                        this.logger.log(
                            `[ConversationalAgentProcessor] No new agent found after context switch, continuing to next processor`,
                        );
                        return this.createContinueResult();
                    }
                } else {
                    this.logger.log(`[ConversationalAgentProcessor] Continuing conversation with ${agent.id}`);
                }
            } else {
                agent = await this.agentRegistry.findBestAgent(context.message);

                if (!agent) {
                    return this.createContinueResult();
                }

                this.logger.log(`[ConversationalAgentProcessor] Starting new conversation with ${agent.id}`);
            }

            const result = await agent.execute({
                agent: context.agent,
                userMessage: context.message,
                contextId: context.contextId,
                conversationContext,
                metadata: context.metadata,
            });

            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number(endTime - startTime) / 1_000_000;

            this.logger.log(
                `[ConversationalAgentProcessor] Agent ${agent.id} executed in ${executionTimeMs.toFixed(1)}ms: state=${
                    result.state
                }, shouldContinue=${result.shouldContinue}`,
            );

            if (result.shouldContinue && result.state !== ConversationState.COMPLETED) {
                const updatedContext = conversationContext || {
                    agentId: agent.id,
                    state: ConversationState.INITIAL,
                    collectedData: {},
                    messageHistory: [],
                    metadata: {
                        startedAt: new Date().toISOString(),
                        lastActivityAt: new Date().toISOString(),
                    },
                };

                updatedContext.state = result.state;
                updatedContext.messageHistory.push(
                    {
                        role: 'user',
                        content: context.message,
                        timestamp: new Date().toISOString(),
                    },
                    {
                        role: 'agent',
                        content: result.message,
                        timestamp: new Date().toISOString(),
                    },
                );
                updatedContext.metadata = {
                    ...updatedContext.metadata,
                    lastActivityAt: new Date().toISOString(),
                };

                if (result.collectedData) {
                    updatedContext.collectedData = {
                        ...updatedContext.collectedData,
                        ...result.collectedData,
                    };
                }

                await this.conversationContextService.saveContext(context.contextId, updatedContext);

                await this.sessionStateService.setConversationalAgentState(context.contextId, agent.id);
            } else {
                await this.conversationContextService.clearContext(context.contextId);
                await this.sessionStateService.clearConversationalAgentState(context.contextId);
            }

            // Se tem handoff, adiciona metadata para response builder
            const shouldGenerateAudio = this.shouldGenerateAudio(context);

            const normalizedActions = this.suggestedActionsService.normalize(result.suggestedActions);

            let nextStep = result.nextStep;
            if (normalizedActions) {
                nextStep = {
                    ...result.nextStep,
                    suggestedActions: normalizedActions,
                };
            }

            return this.createStopResultWithAudio(
                result.message,
                shouldGenerateAudio,
                {
                    processorType: 'conversational_agent',
                    agentId: agent.id,
                    agentName: agent.name,
                    conversationState: result.state,
                    collectedData: result.collectedData || null,
                    executionTimeMs,
                },
                nextStep,
            );
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            this.logError(context, `Erro no processamento de conversational agent (${durationMs.toFixed(1)}ms)`, error);
            return this.createContinueResult();
        }
    }
}
