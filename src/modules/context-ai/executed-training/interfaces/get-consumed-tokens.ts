interface GetConsumedTokens {
    startDate: string;
    endDate: string;
    agentId?: string;
}

interface GetConsumedTokensResponse {
    totalTokensCost: number;
    totalTokens: number;
    date: string;
}

export type { GetConsumedTokens, GetConsumedTokensResponse };
