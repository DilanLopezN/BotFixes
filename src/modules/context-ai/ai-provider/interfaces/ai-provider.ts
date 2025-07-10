import { AiExecute, AiExecuteData, AIProviderType } from '.';

export interface AIProvider {
    execute(data: AiExecute): Promise<AiExecuteData>;
    sendMessage(data: {
        message: string;
        prompt: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
        resultsLength?: number;
        provider: AIProviderType;
    }): Promise<AiExecuteData>;
}
