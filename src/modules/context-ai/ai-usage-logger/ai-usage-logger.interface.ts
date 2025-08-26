export enum ProviderType {
    OPENAI = 'openai',
    GOOGLE = 'google',
}

export enum ModelType {
    // LLM
    GPT_4O = 'gpt-4o',
    GPT_4O_MINI = 'gpt-4o-mini',
    GPT_3_5_TURBO = 'gpt-3.5-turbo',
    GEMINI_2_FLASH = 'gemini-2.0-flash',
    GEMINI_2_FLASH_LITE = 'gemini-2.0-flash-lite',
    // EMBEDDING
    TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
    TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
    TEXT_EMBEDDING_ADA_002 = 'text-embedding-ada-002',
    GEMINI_EMBEDDING = 'gemini-embedding',
}

export interface AiUsageEntity {
    id: string;
    integrationId?: string;
    workspaceId?: string;
    inputTokens: number;
    outputTokens: number;
    inputCostPerTokenUSD: number;
    outputCostPerTokenUSD: number;
    inputPrompt: string;
    outputResponse: string;
    provider: ProviderType;
    model: ModelType;
    originModule?: string;
    originTable?: string;
    originRecordId?: string;
    createdAt: Date;
}
