export interface GuardrailResult {
    allowed: boolean;
    reason?: string;
    filteredContent?: string;
    violationType?: GuardrailViolationType;
    confidence?: number;
}

export enum GuardrailViolationType {
    SEXUAL_CONTENT = 'sexual_content',
    PROMPT_INJECTION = 'prompt_injection',
    TOXIC_LANGUAGE = 'toxic_language',
    MEDICAL_ADVICE = 'medical_advice',
    OFF_TOPIC = 'off_topic',
    BLACKLISTED_WORDS = 'blacklisted_words',
    EXCESSIVE_REPETITION = 'excessive_repetition',
    MAX_LENGTH = 'max_length',
    HTML_CONTENT = 'html_content',
}

export interface GuardrailContext {
    agentId?: string;
    workspaceId?: string;
    messageHistory?: string[];
    customParameters?: Record<string, any>;
}

export interface GuardrailValidator {
    name: string;
    description: string;
    enabled: boolean;

    validate(input: string, context?: GuardrailContext): Promise<GuardrailResult>;
}

export interface GuardrailConfig {
    blacklistedWords?: string[];
    promptInjectionPatterns?: string[];
    thresholds?: {
        toxicity?: number;
        confidence?: number;
    };
    customMessages?: Record<GuardrailViolationType, string>;
}
