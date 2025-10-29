import { Injectable, Logger } from '@nestjs/common';
import { v4 } from 'uuid';
import { DefaultResponse } from '../../../../common/interfaces/default';
import { DoQuestion } from '../interfaces/do-question.interface';
import { ContextMessageService } from '../../context-message/context-message.service';
import { ListMessagesByContext } from '../../context-message/interfaces/list-messages-by-context.interface';
import { ContextMessage } from '../../context-message/entities/context-message.entity';
import { ExecuteResponse } from '../interfaces/context-execute.interface';
import { AgentType } from '../../agent/entities/agent.entity';
import { ConversationOrchestratorService } from './conversation-orchestrator.service';
import { ProcessingContext } from '../interfaces/conversation-processor.interface';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { ResponseBuilderService } from './response-builder.service';
import { DoQuestionErrorCode, ERROR_MESSAGES } from '../enums/error-codes.enum';
import { IAgent } from '../../agent/interfaces/agent.interface';
import { AgentResolutionService } from './agent-resolution.service';

@Injectable()
export class ContextAiImplementorService {
    private logger: Logger = new Logger(ContextAiImplementorService.name);

    constructor(
        private readonly contextMessageService: ContextMessageService,
        private readonly agentResolutionService: AgentResolutionService,
        private readonly conversationOrchestrator: ConversationOrchestratorService,
        private readonly contextVariableService: ContextVariableService,
        private readonly responseBuilderService: ResponseBuilderService,
    ) {}

    public async listMessagesByContext({
        contextId,
    }: ListMessagesByContext): Promise<DefaultResponse<ContextMessage[]>> {
        const result = await this.contextMessageService.listMessagesByContextId(contextId);
        return {
            data: result,
        };
    }

    public async doQuestion(data: DoQuestion): Promise<DefaultResponse<ExecuteResponse>> {
        const { workspaceId, contextId, question, parameters, agentId } = data;

        const agent: IAgent | null = await this.agentResolutionService.resolveAgent({
            workspaceId,
            agentId,
            preferredType: AgentType.RAG,
        });

        const referenceId: string = v4();

        if (!agent) {
            return {
                data: {
                    errorCode: DoQuestionErrorCode.NO_ACTIVE_AGENTS,
                    error: true,
                    errorMessage: ERROR_MESSAGES[DoQuestionErrorCode.NO_ACTIVE_AGENTS],
                    message: null,
                    variables: [],
                },
            };
        }

        try {
            const isDebugMode = process.env.NODE_ENV === 'local';
            const allContextVariables = await this.contextVariableService.listVariablesFromAgent({
                workspaceId,
                agentId: agent.id,
            });

            const processingContext: ProcessingContext = {
                agent,
                message: question,
                contextId,
                workspaceId,
                referenceId,
                parameters,
                metadata: {
                    contextVariables: allContextVariables,
                },
                debug: isDebugMode,
                audioContext: {
                    fromAudio: data.fromAudio || false,
                    shouldGenerateAudio: data.fromAudio || false,
                },
            };

            const result = await this.conversationOrchestrator.process(processingContext);
            const contextVariablesForResponse = await this.contextVariableService.listVariablesFromAgentResume({
                workspaceId,
                agentId: agent.id,
            });

            return this.responseBuilderService.buildResponse({
                result,
                agent,
                data,
                contextVariables: contextVariablesForResponse,
                referenceId,
                debug: processingContext.debug,
            });
        } catch (error) {
            this.logger.error('ContextAiImplementorService.doQuestion', error);
            return {
                data: {
                    errorCode: DoQuestionErrorCode.INTERNAL_PROCESSING_ERROR,
                    error: true,
                    errorMessage: ERROR_MESSAGES[DoQuestionErrorCode.INTERNAL_PROCESSING_ERROR],
                    message: null,
                    variables: [],
                },
            };
        }
    }
}
