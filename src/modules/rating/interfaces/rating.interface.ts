export interface CreateRatingData {
    rating?: number;
    workspaceId: string;
    /** Separadas por virgula(,) */
    tags: string;
    conversationId: string;
    teamId: string;
    channel: string;
    closedBy: string;
    accessedAt?: number;
    exitAt?: number;
    ratingAt?: number;
    identifier?: number;
}
export class QueryRatingDataFilter {
    offset?: number;
    limit?: number;
    teamId?: string;
    teamIds?: string[];
    startDate: string;
    endDate: string;
    timezone?: string;
    value?: number;
    tags?: string[];
    memberId?: string;
    feedback?: feedbackEnum;
}

export enum feedbackEnum {
    all = 'all',
    withFeedback = 'withFeedback',
    noFeedback = 'noFeedback',
}
