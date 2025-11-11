import { doRequest, apiInstance } from '../../../utils/Http';
import {
    FallbackMessageListResponse,
    FallbackMessageListParams,
    ContextMessageListResponse,
    ContextMessageListParams,
} from '../interfaces/fallback-message.interface';

export enum ContextVariableType {
    custom = 'custom',
    context_config = 'context_config',
    action_fallback = 'action_fallback',
    action_button = 'action_button',
    action_redirect = 'action_redirect',
}

export enum InteractionVariableName {
    actionAfterFallback01 = 'action_after_fallback_01',
    actionAfterFallback02 = 'action_after_fallback_02',
    actionAfterFallback03 = 'action_after_fallback_03',
    actionAfterFallback04 = 'action_after_fallback_04',
    actionAfterFallback05 = 'action_after_fallback_05',
    btnAction01 = 'btn_action_01',
    btnAction02 = 'btn_action_02',
    btnAction03 = 'btn_action_03',
    btnFallback01 = 'btn_fallback_01',
    btnFallback02 = 'btn_fallback_02',
    btnFallback03 = 'btn_fallback_03',
    actionAfterResponse = 'action_after_response',
    actionAfterFallback = 'action_after_fallback',
}

export enum AgentType {
    REPORT_PROCESSOR_DETECTION = 'report_processor_detection',
    RAG = 'rag',
    ENTITIES_DETECTION = 'entities_detection',
    CONVERSATIONAL = 'conversational',
}

export enum AgentContext {
    FAQ = 'faq',
    GENERAL = 'general',
}

export enum SkillEnum {
    listInsurances = 'listInsurances',
    listDoctors = 'listDoctors',
    listSpecialities = 'listSpecialities',
    listAppointments = 'listAppointments',
}

export enum ActionType {
    TREE = 'tree',
    AGENT = 'agent',
    // envia para a árvore imediatamente sem responder
    TREE_IMMEDIATELY = 'tree_immediately',
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    prompt: string;
    personality?: string;
    botId?: string | null;
    isDefault: boolean;
    agentType?: AgentType;
    agentContext?: AgentContext | null;
    modelName?: string;
    integrationId?: string;
    allowSendAudio?: boolean;
    allowResponseWelcome?: boolean;
}

export interface TrainingEntry {
    id: string;
    trainingEntryId?: string;
    identifier: string;
    content: string;
    agentId?: string;
    pendingTraining?: boolean;
    executedTrainingAt?: string | null;
    trainingEntryTypeId?: string;
    trainingEntryType?: TrainingEntryType;
    workspaceId?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
    expiresAt?: string | null;
    isActive?: boolean;
}

export interface TrainingEntryType {
    id: string;
    name: string;
    workspaceId: string;
}

export interface CreateTrainingEntryType {
    name: string;
}

export interface UpdateTrainingEntryType {
    id: string;
    name: string;
}

export interface CreateTrainingEntry {
    identifier: string;
    content: string;
    agentId: string;
    trainingEntryTypeId?: string;
    expiresAt?: string | null;
    isActive?: boolean;
}

export interface UpdateTrainingEntry {
    identifier?: string;
    content?: string;
    agentId: string;
    trainingEntryTypeId?: string;
    expiresAt?: string | null;
    isActive?: boolean;
}

export interface ContextVariable {
    id: string;
    contextVariableId?: string;
    name: string;
    value: string;
    type: ContextVariableType;
    botId?: string;
    agentId?: string;
}

export interface CreateContextVariable {
    name: string;
    value: string;
    botId?: string;
    agentId: string;
    type: ContextVariableType;
}

export interface IntentDetection {
    id: string;
    name: string;
    description: string;
    examples: string[];
    agentId: string;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
    actions?: IntentAction[];
}

export interface CreateIntentDetection {
    name: string;
    description: string;
    examples: string[];
    agentId: string;
}

export interface UpdateIntentDetection {
    intentDetectionId: string;
    name: string;
    description: string;
    examples: string[];
    agentId: string;
}

export interface IntentAction {
    id: string;
    intentId: string;
    actionType: ActionType;
    targetValue: string;
    createdAt: string;
}

export interface CreateIntentAction {
    intentId: string;
    actionType: ActionType;
    targetValue: string;
}

export interface UpdateIntentAction {
    intentActionsId: string;
    actionType: ActionType;
    targetValue: string;
}

export interface IntentLibraryItem {
    id: string;
    name: string;
    description: string;
    examples: string[];
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreateIntentLibraryPayload {
    name: string;
    description: string;
    examples: string[];
}

export interface UpdateIntentLibraryPayload {
    intentLibraryId: string;
    name?: string;
    description?: string;
    examples?: string[];
}

export interface ListIntentLibraryParams {
    search?: string;
}

export interface ImportIntentFromLibraryPayload {
    intentLibraryId: string;
    agentId: string;
}

export interface DetectIntentResponse {
    intent: {
        id: string;
        name: string;
    };
    actions: Array<{
        id: string;
        actionType: string;
        targetValue: string;
    }>;
    tokens: number;
}

export interface DoQuestionResponse {
    message: {
        fromInteractionId: string | null;
        workspaceId: string;
        botId: string | null;
        referenceId: string;
        contextId: string;
        content: string;
        role: string;
        completionTokens: number;
        promptTokens: number;
        agentId: string;
        isFallback: boolean;
        modelName: string;
        type: string;
        createdAt: string;
        id: string;
        nextStep?: {
            suggestedActions?: Array<{
                label: string;
                value: string;
                type: string;
            }>;
        };
    } | null;
    nextStep: {
        intent: string;
        reason: string;
        entities: Record<string, string[]>;
    };
    variables: Array<{
        id: string;
        name: string;
        value: string;
    }>;
    intent: {
        actions: Array<{
            id: string;
            intentId: string;
            actionType: string;
            targetValue: string;
            createdAt: string;
        }>;
        detectedIntent: {
            id: string;
            name: string;
            description: string;
            examples: string[];
            agentId: string;
            workspaceId: string;
            createdAt: string;
            updatedAt: string;
            deletedAt: string | null;
        } | null;
        interaction: {
            _id: string;
            name: string;
            type: string;
            [key: string]: any;
        } | null;
    };
    traceId?: string;
}

export interface ConversationTrace {
    traceId: string;
    logs: Array<{
        timestamp: string;
        level: string;
        message: string;
        data?: any;
        [key: string]: any;
    }>;
    [key: string]: any;
}

export interface AgentSkill {
    id: string;
    name: SkillEnum;
    description: string | null;
    prompt: string | null;
    workspaceId: string;
    agentId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAgentSkill {
    name: SkillEnum;
    agentId: string;
    isActive: boolean;
    description?: string;
    prompt?: string;
}

export interface UpdateAgentSkill {
    skillId: string;
    name: SkillEnum;
    agentId: string;
    isActive: boolean;
    description?: string;
    prompt?: string;
}

export interface DeleteAgentSkill {
    skillId: string;
    agentId: string;
}

export interface ListAgentSkills {
    agentId: string;
}

export const AIAgentService = {
    // Agent operations
    createAgent: async (workspaceId: string, data: Omit<Agent, 'id'>, errCb?): Promise<Agent> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent/createAgent`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    listAgents: async (workspaceId: string, errCb?): Promise<Agent[]> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent/listAgents`),
            undefined,
            errCb
        );
        return response?.data;
    },

    getAgent: async (workspaceId: string, agentId: string, errCb?): Promise<Agent> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent/getAgent`, { agentId }),
            undefined,
            errCb
        );
        return response?.data;
    },

    updateAgent: async (workspaceId: string, agentId: string, data: Partial<Agent>, errCb?): Promise<Agent> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent/updateAgent`, { agentId, ...data }),
            undefined,
            errCb
        );
        return response?.data;
    },

    deleteAgent: async (workspaceId: string, agentId: string, errCb?): Promise<{ ok: boolean }> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent/deleteAgent`, { agentId }),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Training operations
    createTrainingEntry: async (workspaceId: string, data: CreateTrainingEntry, errCb?): Promise<TrainingEntry> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry/createTrainingEntry`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    listTrainingEntries: async (workspaceId: string, agentId?: string, errCb?): Promise<TrainingEntry[]> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/training-entry/listTrainingEntries`,
                agentId ? { agentId } : {}
            ),
            undefined,
            errCb
        );
        return response?.data;
    },

    getTrainingEntry: async (workspaceId: string, trainingEntryId: string, errCb?): Promise<TrainingEntry> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry/getTrainingEntry`, {
                trainingEntryId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    updateTrainingEntry: async (
        workspaceId: string,
        trainingEntryId: string,
        data: UpdateTrainingEntry,
        errCb?
    ): Promise<TrainingEntry> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry/updateTrainingEntry`, {
                trainingEntryId,
                ...data,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    deleteTrainingEntry: async (
        workspaceId: string,
        trainingEntryId: string,
        agentId: string,
        errCb?
    ): Promise<{ ok: boolean }> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry/deleteTrainingEntry`, {
                trainingEntryId,
                agentId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    doTraining: async (workspaceId: string, data: { forceAll: boolean; agentId: string }, errCb?): Promise<any> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry/doTraining`, data, {
                timeout: 120000, // 2 minutos
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Context variable operations
    createContextVariable: async (
        workspaceId: string,
        data: CreateContextVariable,
        errCb?
    ): Promise<ContextVariable> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/context-variable/createContextVariable`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    listContextVariables: async (workspaceId: string, agentId?: string, errCb?): Promise<ContextVariable[]> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/context-variable/listContextVariables`,
                agentId ? { agentId } : {}
            ),
            undefined,
            errCb
        );
        return response?.data;
    },

    getContextVariable: async (workspaceId: string, contextVariableId: string, errCb?): Promise<ContextVariable> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/context-variable/getContextVariable`, {
                contextVariableId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    updateContextVariable: async (
        workspaceId: string,
        contextVariableId: string,
        data: { contextVariableId: string; value: string; agentId: string },
        errCb?
    ): Promise<ContextVariable> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/context-variable/updateContextVariable`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    deleteContextVariable: async (
        workspaceId: string,
        contextVariableId: string,
        agentId: string,
        errCb?
    ): Promise<{ ok: boolean }> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/context-variable/deleteContextVariable`, {
                contextVariableId,
                agentId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    listPredefinedPersonalities: async (
        workspaceId: string,
        errCb?
    ): Promise<{ identifier: string; content: string }[]> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent/listPredefinedPersonalities`),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Fallback message operations
    listFallbackMessages: async (
        workspaceId: string,
        params: FallbackMessageListParams,
        errCb?
    ): Promise<FallbackMessageListResponse> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/context-fallback-message/listFallbackMessages`,
                params
            ),
            undefined,
            errCb
        );
        return response;
    },

    // Context message operations
    listContextMessages: async (
        workspaceId: string,
        params: ContextMessageListParams,
        errCb?
    ): Promise<ContextMessageListResponse> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/context-message/listContextMessages`, params),
            undefined,
            errCb
        );
        return response;
    },

    // Intent detection operations
    createIntentDetection: async (
        workspaceId: string,
        data: CreateIntentDetection,
        errCb?
    ): Promise<IntentDetection> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-detection/createIntentDetection`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    listIntentDetection: async (workspaceId: string, agentId?: string, errCb?): Promise<IntentDetection[]> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/intent-detection/listIntentDetection`,
                agentId ? { agentId } : {}
            ),
            undefined,
            errCb
        );
        return response?.data;
    },

    updateIntentDetection: async (
        workspaceId: string,
        data: UpdateIntentDetection,
        errCb?
    ): Promise<IntentDetection> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-detection/updateIntentDetection`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    deleteIntentDetection: async (workspaceId: string, intentDetectionId: string, errCb?): Promise<{ ok: boolean }> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-detection/deleteIntentDetection`, {
                intentDetectionId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    detectIntent: async (workspaceId: string, text: string, agentId: string, errCb?): Promise<DetectIntentResponse> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-detection/detectIntent`, {
                text,
                agentId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Intent actions operations
    createIntentAction: async (workspaceId: string, data: CreateIntentAction, errCb?): Promise<IntentAction> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-actions/createIntentAction`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    updateIntentAction: async (workspaceId: string, data: UpdateIntentAction, errCb?): Promise<IntentAction> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-actions/updateIntentAction`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Intent library operations
    createIntentLibrary: async (
        workspaceId: string,
        data: CreateIntentLibraryPayload,
        errCb?
    ): Promise<IntentLibraryItem> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-library/createIntentLibrary`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    listIntentLibrary: async (
        workspaceId: string,
        params?: ListIntentLibraryParams,
        errCb?
    ): Promise<IntentLibraryItem[]> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/intent-library/listIntentLibrary`,
                params ?? {}
            ),
            undefined,
            errCb
        );
        return response?.data || [];
    },

    updateIntentLibrary: async (
        workspaceId: string,
        data: UpdateIntentLibraryPayload,
        errCb?
    ): Promise<IntentLibraryItem> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-library/updateIntentLibrary`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    deleteIntentLibrary: async (
        workspaceId: string,
        intentLibraryId: string,
        errCb?
    ): Promise<{ ok: boolean }> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/intent-library/deleteIntentLibrary`, {
                intentLibraryId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    importIntentFromLibrary: async (
        workspaceId: string,
        data: ImportIntentFromLibraryPayload,
        errCb?
    ): Promise<IntentDetection> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/intent-detection/importIntentFromLibrary`,
                data
            ),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Bulk upload operations
    bulkUploadTrainingEntries: async (
        workspaceId: string,
        agentId: string,
        file: File,
        errCb?
    ): Promise<{ created: number; errors: string[] }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agentId', agentId);

        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry/bulkUpload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Debug/Testing operations
    doQuestion: async (
        workspaceId: string,
        question: string,
        botId: string,
        contextId: string,
        agentId: string,
        useHistoricMessages: boolean = false,
        parameters?: Record<string, any>,
        errCb?
    ): Promise<DoQuestionResponse> => {
        const requestBody: any = {
            question,
            botId,
            useHistoricMessages,
            contextId,
            agentId,
        };

        // Add optional parameters if provided
        if (parameters && Object.keys(parameters).length > 0) {
            requestBody.parameters = parameters;
        }

        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/context-ai-implementor/doQuestion`, requestBody, {
                timeout: 120_000,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    getConversationTrace: async (
        workspaceId: string,
        traceId: string,
        errCb?
    ): Promise<ConversationTrace> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-traces/getTrace`, {
                traceId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Agent Skills operations
    createAgentSkill: async (workspaceId: string, data: CreateAgentSkill, errCb?): Promise<AgentSkill> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent-skills/createAgentSkill`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    listAgentSkills: async (workspaceId: string, data: ListAgentSkills, errCb?): Promise<AgentSkill[]> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent-skills/listAgentSkills`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    getAgentSkill: async (
        workspaceId: string,
        data: { skillId: string; agentId: string },
        errCb?
    ): Promise<AgentSkill> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent-skills/getAgentSkill`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    updateAgentSkill: async (workspaceId: string, data: UpdateAgentSkill, errCb?): Promise<AgentSkill> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent-skills/updateAgentSkill`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    deleteAgentSkill: async (workspaceId: string, data: DeleteAgentSkill, errCb?): Promise<{ ok: boolean }> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/agent-skills/deleteAgentSkill`, data),
            undefined,
            errCb
        );
        return response?.data;
    },

    // Training Entry Type operations
    createTrainingEntryType: async (
        workspaceId: string,
        data: CreateTrainingEntryType,
        errCb?
    ): Promise<TrainingEntryType> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/training-entry-type/createTrainingEntryType`,
                data
            ),
            undefined,
            errCb
        );
        return response?.data;
    },

    updateTrainingEntryType: async (
        workspaceId: string,
        data: UpdateTrainingEntryType,
        errCb?
    ): Promise<TrainingEntryType> => {
        const response = await doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/conversation-ai/training-entry-type/updateTrainingEntryType`,
                data
            ),
            undefined,
            errCb
        );
        return response?.data;
    },

    listTrainingEntryTypes: async (workspaceId: string, errCb?): Promise<TrainingEntryType[]> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry-type/listTrainingEntryTypes`),
            undefined,
            errCb
        );
        return response?.data;
    },

    deleteTrainingEntryType: async (
        workspaceId: string,
        trainingEntryTypeId: string,
        errCb?
    ): Promise<{ ok: boolean }> => {
        const response = await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/conversation-ai/training-entry-type/deleteTrainingEntryType`, {
                id: trainingEntryTypeId,
            }),
            undefined,
            errCb
        );
        return response?.data;
    },
};
