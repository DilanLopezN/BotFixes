export interface HealthAnalyticsFilters {
    tags: string[];
    botId?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
    teamIds?: string[];
    channelIds?: string[];
    workspaceId: string;
    ommitFields?: boolean;
    pivotConfig?: string[];
}
