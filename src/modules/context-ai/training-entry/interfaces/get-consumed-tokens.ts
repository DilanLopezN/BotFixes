interface GetConsumedTokens {
    startDate: string;
    endDate: string;
}

interface GetConsumedTokensResponse {
    totalTokensCost: number;
    totalTokens: number;
    date: string;
}

export type { GetConsumedTokens, GetConsumedTokensResponse };
