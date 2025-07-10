interface AiExecuteResponse {
    message: string;
    nextStep: Record<string, any> | null;
    isFallback: boolean;
    promptTokens: number;
    completionTokens: number;
}

export type { AiExecuteResponse };
