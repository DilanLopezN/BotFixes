interface GetConsumedTokens {
    startDate: string;
    endDate: string;
}

interface GetConsumedTokensResponse {
    promptTokensCost: number;
    completionTokensCost: number;
    promptTokens: number;
    completionTokens: number;
    date: string;
}

export type { GetConsumedTokens, GetConsumedTokensResponse };
