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
    provider?: AIProviderType;
    prompt: string;
}

export { AiExecute, AiExecuteData, AiMessage };
