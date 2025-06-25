export interface ConversationQueryFilters {
    state?: string;
    tags?: string[];
    teams?: string[];
    startDate?: number;
    endDate?: number;
    channels?: string[];
    historicConversationTeams?: string[];
}
