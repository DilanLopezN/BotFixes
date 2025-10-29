export type NextStepMapEntities = {
    doctor_name: string | null;
    procedure_name: string | null;
    specialty: string | null;
    health_plan: string | null;
};

export type NextStepMap = {
    intent: string;
    entities: NextStepMapEntities;
};

export interface AiProviderResponse {
    result: {
        next_step_map: NextStepMap;
        response: string;
    };
    error: string | null;
}

export enum AiProviderError {
    ContextIrrelevant = 'ERR_01',
    InvalidQuestion = 'ERR_02',
    ContextNotFound = 'ERR_03',
}

export const DEFAULT_PATTERN_ERROR_TOKEN = 'ERR_';
