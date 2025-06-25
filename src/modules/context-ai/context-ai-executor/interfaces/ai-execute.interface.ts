interface AiExecuteResponse {
    message: string;
    isFallback: boolean;
    promptTokens: number;
    completionTokens: number;
}

export type { AiExecuteResponse };
