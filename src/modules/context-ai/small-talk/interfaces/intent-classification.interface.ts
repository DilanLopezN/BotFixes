import { IntentType } from '../enums/intent-type.enum';

export interface IntentPattern {
    patterns: RegExp[];
    intentType: IntentType;
}

export interface IntentClassification {
    type: IntentType;
    confidence: number;
    needsLLM: boolean;
}

export interface LLMIntentResponse {
    type: string;
    confidence: number;
}

export interface ClassifyAndGenerateResult {
    intentType: IntentType;
    confidence: number;
    response: string;
}
