import { ModelType, ProviderType } from './ai-usage-logger.interface';

export const AiModelPricing: Record<ModelType, { input: number; output: number; provider: ProviderType }> = {
    [ModelType.GPT_4O]: {
        input: 5,
        output: 20,
        provider: ProviderType.OPENAI,
    },
    [ModelType.GPT_4O_MINI]: {
        input: 0.15,
        output: 0.6,
        provider: ProviderType.OPENAI,
    },
    [ModelType.GPT_3_5_TURBO]: {
        input: 0.5,
        output: 1.5,
        provider: ProviderType.OPENAI,
    },
    [ModelType.GEMINI_2_FLASH]: {
        input: 0.1,
        output: 0.4,
        provider: ProviderType.GOOGLE,
    },
    [ModelType.GEMINI_2_FLASH_LITE]: {
        input: 0.075,
        output: 0.3,
        provider: ProviderType.GOOGLE,
    },
    [ModelType.TEXT_EMBEDDING_3_SMALL]: {
        input: 0.02,
        output: 0,
        provider: ProviderType.OPENAI,
    },
    [ModelType.TEXT_EMBEDDING_3_LARGE]: {
        input: 0.13,
        output: 0,
        provider: ProviderType.OPENAI,
    },
    [ModelType.TEXT_EMBEDDING_ADA_002]: {
        input: 0.1,
        output: 0,
        provider: ProviderType.OPENAI,
    },
    [ModelType.GEMINI_EMBEDDING]: {
        input: 0.15,
        output: 0,
        provider: ProviderType.GOOGLE,
    },
};
