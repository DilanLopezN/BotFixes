import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntentDetection } from '../entities/intent-detection.entity';
import {
    CreateIntentDetectionData,
    DeleteIntentDetectionData,
    IIntentDetection,
    ListIntentDetectionFilter,
    UpdateIntentDetectionData,
} from '../interfaces/intent-detection.interface';
import { CONTEXT_AI } from '../../ormconfig';
import { OpenIaProviderService } from '../../ai-provider/providers/openai-provider.service';
import { AgentService } from '../../agent/services/agent.service';
import { AgentType } from '../../agent/interfaces/agent.interface';
import { IntentActionsService } from './intent-actions.service';
import { IntentDetectionUserHistoryService } from './intent-detection-user-history.service';
import {
    IIntentDetectionUserHistory,
    ListIntentDetectionUserHistoryFilter,
} from '../interfaces/intent-detection-user-history.interface';
import { MessageContextValidator } from '../validator/message-context.validator';
import { InteractionsService } from '../../../interactions/services/interactions.service';
import { omit } from 'lodash';
import { IIntentActions } from '../interfaces/intent-actions.interface';

@Injectable()
export class IntentDetectionService {
    constructor(
        @InjectRepository(IntentDetection, CONTEXT_AI)
        private readonly intentDetectionRepository: Repository<IntentDetection>,
        private readonly openIaProviderService: OpenIaProviderService,
        private readonly agentService: AgentService,
        private readonly intentActionsService: IntentActionsService,
        private readonly intentDetectionUserHistoryService: IntentDetectionUserHistoryService,
        private readonly messageContextValidator: MessageContextValidator,
        @Inject(forwardRef(() => InteractionsService))
        private readonly interactionsService: InteractionsService,
    ) {}

    public async create(data: CreateIntentDetectionData): Promise<IIntentDetection> {
        await this.validateAgentTypeAndWorkspace(data.agentId, data.workspaceId);

        const intentDetection = this.intentDetectionRepository.create(data);
        return this.intentDetectionRepository.save(intentDetection);
    }

    public async update(data: UpdateIntentDetectionData): Promise<IIntentDetection> {
        const intentDetection = await this.intentDetectionRepository.findOne({
            where: { id: data.intentDetectionId, deletedAt: null },
        });

        if (!intentDetection) {
            throw new NotFoundException(`IntentDetection with ID ${data.intentDetectionId} not found`);
        }

        if (data.agentId && data.workspaceId) {
            await this.validateAgentTypeAndWorkspace(data.agentId, data.workspaceId);
        } else if (data.agentId) {
            await this.validateAgentTypeAndWorkspace(data.agentId, intentDetection.workspaceId);
        }

        Object.assign(intentDetection, data);

        return this.intentDetectionRepository.save(intentDetection);
    }

    public async delete(data: DeleteIntentDetectionData): Promise<{ ok: boolean }> {
        const intentDetection = await this.intentDetectionRepository.findOne({
            where: { id: data.intentDetectionId, deletedAt: null },
        });

        if (!intentDetection) {
            throw new NotFoundException(`IntentDetection with ID ${data.intentDetectionId} not found`);
        }

        intentDetection.deletedAt = new Date();
        await this.intentDetectionRepository.save(intentDetection);

        return { ok: true };
    }

    public async findById(intentDetectionId: string): Promise<IIntentDetection | null> {
        return this.intentDetectionRepository.findOne({
            where: { id: intentDetectionId, deletedAt: null },
        });
    }

    public async findByAgentId(agentId: string): Promise<IIntentDetection[]> {
        return this.intentDetectionRepository.find({
            where: { agentId, deletedAt: null },
            order: { name: 'ASC' },
        });
    }

    public async list(filter: ListIntentDetectionFilter): Promise<IIntentDetection[]> {
        const whereClause: any = { deletedAt: null };

        if (filter.workspaceId) {
            whereClause.workspaceId = filter.workspaceId;
        }

        if (filter.agentId) {
            whereClause.agentId = filter.agentId;
        }

        const intents = await this.intentDetectionRepository.find({
            where: whereClause,
            order: {
                name: 'ASC',
                createdAt: 'DESC',
            },
        });

        const results = await Promise.all(
            intents.map(async (intent) => {
                const actions = await this.intentActionsService.findByIntentId(intent.id);
                return {
                    ...intent,
                    actions,
                };
            }),
        );

        return results;
    }

    public async detectIntentWithAI(
        text: string,
        workspaceId: string,
        agentId?: string,
        contextId?: string,
        fromInteractionId?: string,
    ): Promise<{
        intent: { id: string; name: string } | null;
        actions: { id: string; actionType: string; targetValue: string }[];
        interaction: any;
        tokens: number;
    }> {
        this.messageContextValidator.validate(text);

        let finalAgentId = agentId;

        if (!finalAgentId) {
            const defaultAgent = await this.agentService.getDefaultAgentByType(
                workspaceId,
                AgentType.ENTITIES_DETECTION,
            );
            if (!defaultAgent) {
                throw new NotFoundException(
                    `No default agent of type ENTITIES_DETECTION found in workspace ${workspaceId}`,
                );
            }
            finalAgentId = defaultAgent.id;
        } else {
            await this.validateAgentTypeAndWorkspace(finalAgentId, workspaceId);
        }

        const intentPrompt = await this.buildIntentDetectionPrompt(finalAgentId, text);
        const intentDefinitions = await this.findByAgentId(finalAgentId);

        if (intentDefinitions.length === 0) {
            return { intent: null, actions: [], interaction: null, tokens: 0 };
        }

        const message = `Texto para análise: "${text}"`;

        try {
            const result = await this.openIaProviderService.sendMessage({
                message,
                prompt: intentPrompt,
                temperature: 0,
                model: 'gpt-4o-mini',
                resultsLength: 1,
                maxTokens: 256,
            });

            const detectedIntentionId = this.parseIntentResponse(result.response?.choices[0]?.message?.content || '');
            const totalTokens = result.promptTokens + result.completionTokens;

            const { interaction, actions, detectedIntent } = await this.getIntentDetectionById(
                detectedIntentionId,
                finalAgentId,
            );

            await this.intentDetectionUserHistoryService.create({
                workspaceId,
                agentId: finalAgentId,
                inputText: text,
                detectedIntentId: detectedIntent?.id || null,
                detected: !!detectedIntent,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
                actionsReturned: actions.map((action) => action.id),
                contextId,
                fromInteractionId,
            });

            return {
                intent: detectedIntent ? { id: detectedIntent.id, name: detectedIntent.name } : null,
                actions: actions.map((action) => ({
                    id: action.id,
                    actionType: action.actionType,
                    targetValue: action.targetValue,
                })),
                interaction,
                tokens: totalTokens,
            };
        } catch (error) {
            await this.intentDetectionUserHistoryService.create({
                workspaceId,
                agentId: finalAgentId,
                inputText: text,
                detectedIntentId: null,
                detected: false,
                promptTokens: 0,
                completionTokens: 0,
                actionsReturned: null,
                contextId,
                fromInteractionId,
            });

            return { intent: null, actions: [], interaction: null, tokens: 0 };
        }
    }

    public async listDetectionUserHistory(
        filter: ListIntentDetectionUserHistoryFilter,
    ): Promise<IIntentDetectionUserHistory[]> {
        return this.intentDetectionUserHistoryService.list(filter);
    }

    private async buildIntentDetectionPrompt(agentId: string, text: string): Promise<string> {
        const intentDefinitions = await this.findByAgentId(agentId);

        const intentsInfo = intentDefinitions.map((intent) => ({
            id: intent.id,
            name: intent.name,
            description: intent.description,
            examples: intent.examples,
        }));

        return `
Você é um sistema especializado em identificar a intenção principal de mensagens enviadas por pacientes em um chatbot da área da saúde.
Sua tarefa é analisar o texto da mensagem com atenção e selecionar, entre as intenções disponíveis para este cliente, **a mais adequada ao que a pessoa está tentando comunicar**.

Intenções disponíveis:
${intentsInfo
    .map(
        (intent) => `
- **ID: ${intent.id}**
  Nome: ${intent.name}
  Descrição: ${intent.description}
  Exemplos: ${intent.examples.join(', ')}
`,
    )
    .join('\n')}

INSTRUÇÕES:
1. Leia o texto com atenção, considerando o contexto típico de conversas na área da saúde
2. Compare o conteúdo da mensagem com as intenções disponíveis para este cliente (mesmo que existam intenções parecidas)
3. Escolha **apenas uma** intenção — aquela que melhor representa o objetivo da pessoa
4. Dê atenção especial a termos de ação (ex: agendar, reagendar, cancelar, saber, localizar, confirmar) e a palavras-chave de contexto (ex: consulta, exame, resultado, médico, horário)
5. Se não for possível identificar uma intenção clara entre as disponíveis, retorne **null**
6. Retorne **apenas o ID** da intenção correspondente, sem explicações ou texto adicional

Resposta (apenas o ID da intenção ou null):`;
    }

    private parseIntentResponse(response: string): string | null {
        try {
            const cleanResponse = response
                .trim()
                .replace(/```json|```/g, '')
                .replace(/"/g, '')
                .trim();

            if (cleanResponse === 'null' || cleanResponse === '') {
                return null;
            }

            return cleanResponse;
        } catch (error) {
            console.error('Error parsing intention response:', error);
            return null;
        }
    }

    private async validateAgentTypeAndWorkspace(agentId: string, workspaceId: string): Promise<void> {
        const agent = await this.agentService.findByWorkspaceIdAndId(agentId, workspaceId);

        if (!agent) {
            throw new NotFoundException(`Agent with ID ${agentId} not found in workspace ${workspaceId}`);
        }
    }

    public async getIntentDetectionById(
        detectedIntentionId: string,
        agentId: string,
    ): Promise<{ interaction: IIntentDetection; detectedIntent: IIntentDetection; actions: IIntentActions[] }> {
        if (!detectedIntentionId) {
            return { actions: [], detectedIntent: null, interaction: null };
        }

        const intentDefinitions = await this.findByAgentId(agentId);
        const detectedIntent = detectedIntentionId
            ? intentDefinitions.find((intent) => intent.id === detectedIntentionId)
            : null;

        const actions = detectedIntent ? await this.intentActionsService.findByIntentId(detectedIntent.id) : [];
        const treeAction = actions.find((action) => action.actionType === 'tree');

        if (!treeAction) {
            return { actions: [], detectedIntent, interaction: null };
        }

        try {
            const originalInteraction = await this.interactionsService.getOne(treeAction.targetValue);

            const findedLanguage = originalInteraction.languages.find((languageInteraction) => {
                return languageInteraction.language == 'pt-BR';
            });

            const leanInteraction =
                originalInteraction.toJSON?.({
                    minimize: false,
                }) ?? originalInteraction;

            const newInteractionObj = {
                ...(omit(leanInteraction, ['languages']) as any),
                responses: findedLanguage.responses,
                userSays: findedLanguage.userSays,
                intents: findedLanguage?.intents || [],
            };

            if (newInteractionObj.params) {
                newInteractionObj.params.dialogFlow = null;
            }

            return {
                interaction: { ...newInteractionObj, languages: undefined },
                actions,
                detectedIntent,
            };
        } catch (error) {
            console.error('Error fetching interaction:', error);
            return { actions: [], detectedIntent: null, interaction: null };
        }
    }
}
