import { AIProviderType } from '.';

interface AiExecuteData {
    message: string;
    promptTokens: number;
    completionTokens: number;
}

interface AiImageData {
    data: string;
    mimeType: string;
}

interface AiMessage {
    content: string;
    role: 'user' | 'system';
    image?: AiImageData;
}

interface AiExecute {
    messages?: AiMessage[];
    maxTokens?: number;
    temperature?: number;
    provider?: AIProviderType;
    prompt: string;
    model?: string;
    presencePenalty?: number;
    frequencyPenalty?: number;
    image?: AiImageData;
}

export { AiExecute, AiExecuteData, AiMessage, AiImageData };
