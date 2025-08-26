import { AIProviderType } from '.';

interface AiExecuteData {
    message: string;
    promptTokens: number;
    completionTokens: number;
}

interface AiMessage {
    content: string;
    role: 'user' | 'system';
}

interface AiExecute {
    messages: AiMessage[];
    maxTokens?: number;
    temperature?: number;
    provider?: AIProviderType;
    prompt: string;
    model?: string;
    presencePenalty?: number;
    frequencyPenalty?: number;
}

export { AiExecute, AiExecuteData, AiMessage };
